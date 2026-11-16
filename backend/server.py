from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, UploadFile, File, Query
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import secrets
import random
import pickle
import bcrypt
import jwt
import numpy as np
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field
from typing import Optional
from bson import ObjectId

# Directories
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
MODEL_DIR = ROOT_DIR / "models"
MODEL_DIR.mkdir(exist_ok=True)

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT
JWT_SECRET = os.environ.get("JWT_SECRET", secrets.token_hex(32))
JWT_ALGORITHM = "HS256"

# App
app = FastAPI(title="Smart Farming API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============================================================
# PYDANTIC MODELS
# ============================================================

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "farmer"

class LoginRequest(BaseModel):
    email: str
    password: str

class CropPredictRequest(BaseModel):
    nitrogen: float
    phosphorus: float
    potassium: float
    temperature: float
    humidity: float
    ph: float
    rainfall: float

class SensorDataCreate(BaseModel):
    sensor_type: str
    value: float
    unit: str
    location: str = ""

# ============================================================
# AUTH HELPERS
# ============================================================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(hours=1), "type": "access"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============================================================
# ML MODEL - Crop Recommendation
# ============================================================

CROP_PARAMS = {
    "rice": [80,10,48,8,40,5,24,3,82,5,6.5,0.3,230,30],
    "wheat": [90,12,42,6,45,6,22,3,65,8,6.8,0.4,100,20],
    "maize": [78,10,58,8,20,4,25,3,70,6,6.2,0.3,85,15],
    "cotton": [120,15,46,7,20,4,28,3,68,7,7.0,0.3,80,15],
    "sugarcane": [100,12,50,8,50,6,27,2,80,5,6.5,0.3,110,20],
    "coffee": [100,10,20,5,30,5,25,2,60,5,6.5,0.4,160,25],
    "coconut": [20,5,10,3,30,5,27,2,90,5,6.0,0.3,150,30],
    "jute": [80,10,40,6,40,5,25,2,85,5,7.0,0.3,175,25],
    "apple": [20,5,125,15,200,20,22,3,90,5,6.0,0.3,110,15],
    "mango": [20,5,18,4,30,5,30,3,50,8,5.5,0.3,95,15],
    "banana": [100,12,75,10,50,6,27,2,80,5,6.0,0.3,105,15],
    "grapes": [20,5,125,15,200,20,24,3,80,5,6.0,0.4,70,10],
    "orange": [20,5,10,3,10,2,22,3,90,5,7.0,0.3,110,15],
    "papaya": [50,8,60,8,50,6,30,3,90,5,6.5,0.3,140,20],
    "pomegranate": [20,5,10,3,40,5,22,3,90,5,6.5,0.3,105,15],
    "watermelon": [100,12,20,4,50,6,26,3,85,5,6.5,0.3,50,10],
    "lentil": [20,5,60,8,20,4,25,3,65,8,7.0,0.3,45,10],
    "chickpea": [40,8,60,8,80,10,19,3,17,5,7.0,0.3,70,12],
    "kidney_beans": [20,5,60,8,20,4,20,3,22,5,6.0,0.3,60,12],
    "mungbean": [20,5,45,6,20,4,28,3,85,5,6.5,0.3,50,10],
}

crop_model = None
crop_label_encoder = None

def train_crop_model():
    global crop_model, crop_label_encoder
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.preprocessing import LabelEncoder

    np.random.seed(42)
    X_data, y_data = [], []
    for crop, p in CROP_PARAMS.items():
        for _ in range(100):
            X_data.append([
                np.random.normal(p[0], p[1]), np.random.normal(p[2], p[3]),
                np.random.normal(p[4], p[5]), np.random.normal(p[6], p[7]),
                np.random.normal(p[8], p[9]), np.random.normal(p[10], p[11]),
                np.random.normal(p[12], p[13]),
            ])
            y_data.append(crop)

    le = LabelEncoder()
    y_encoded = le.fit_transform(y_data)
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_data, y_encoded)
    crop_model, crop_label_encoder = model, le

    with open(MODEL_DIR / "crop_model.pkl", "wb") as f:
        pickle.dump({"model": model, "label_encoder": le}, f)
    logger.info("Crop model trained and saved")

def load_crop_model():
    global crop_model, crop_label_encoder
    path = MODEL_DIR / "crop_model.pkl"
    if path.exists():
        with open(path, "rb") as f:
            data = pickle.load(f)
            crop_model, crop_label_encoder = data["model"], data["label_encoder"]
    else:
        train_crop_model()

def predict_crop(n, p, k, temp, hum, ph, rain):
    if crop_model is None:
        load_crop_model()
    features = np.array([[n, p, k, temp, hum, ph, rain]])
    pred = crop_model.predict(features)[0]
    probs = crop_model.predict_proba(features)[0]
    crop_name = crop_label_encoder.inverse_transform([pred])[0]
    top_indices = np.argsort(probs)[-3:][::-1]
    top_crops = [
        {"crop": crop_label_encoder.inverse_transform([i])[0], "confidence": round(float(probs[i]) * 100, 2)}
        for i in top_indices
    ]
    return {"recommended_crop": crop_name, "confidence": round(float(max(probs)) * 100, 2), "top_recommendations": top_crops}

# Disease detection (simulated - no real CNN)
DISEASES = {
    "bacterial_blight": {"name": "Bacterial Blight", "treatment": "Apply copper-based bactericides. Remove infected parts. Practice crop rotation.", "severity": "high"},
    "leaf_rust": {"name": "Leaf Rust", "treatment": "Apply propiconazole fungicide. Plant resistant varieties. Ensure proper spacing.", "severity": "medium"},
    "powdery_mildew": {"name": "Powdery Mildew", "treatment": "Apply sulfur spray. Improve air circulation. Remove affected leaves.", "severity": "medium"},
    "early_blight": {"name": "Early Blight", "treatment": "Apply chlorothalonil fungicide. Remove infected leaves. Mulch around plants.", "severity": "high"},
    "late_blight": {"name": "Late Blight", "treatment": "Apply metalaxyl fungicide. Destroy infected plants. Avoid overhead watering.", "severity": "critical"},
    "healthy": {"name": "Healthy", "treatment": "No treatment needed. Continue regular maintenance and monitoring.", "severity": "none"},
}

# ============================================================
# ROUTERS
# ============================================================

auth_router = APIRouter(prefix="/api/auth", tags=["Auth"])
crop_router = APIRouter(prefix="/api/crop", tags=["Crop"])
weather_router = APIRouter(prefix="/api/weather", tags=["Weather"])
sensor_router = APIRouter(prefix="/api/sensor", tags=["Sensor"])
disease_router = APIRouter(prefix="/api/disease", tags=["Disease"])
dashboard_router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])
notification_router = APIRouter(prefix="/api/notifications", tags=["Notifications"])
user_router = APIRouter(prefix="/api/users", tags=["Users"])

# ============================================================
# AUTH ROUTES
# ============================================================

@auth_router.post("/register")
async def register(data: RegisterRequest, response: Response):
    email = data.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    valid_roles = ["farmer", "admin", "agriculture_officer"]
    role = data.role.lower().strip().replace(" ", "_")
    if role not in valid_roles:
        raise HTTPException(status_code=400, detail="Invalid role")
    user_doc = {
        "name": data.name.strip(), "email": email,
        "password_hash": hash_password(data.password),
        "role": role, "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    set_auth_cookies(response, access_token, refresh_token)
    return {"id": user_id, "name": user_doc["name"], "email": email, "role": role, "token": access_token}

@auth_router.post("/login")
async def login(data: LoginRequest, request: Request, response: Response):
    email = data.email.lower().strip()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt and attempt.get("attempts", 0) >= 5:
        last = attempt.get("last_attempt")
        if last:
            if isinstance(last, str):
                last = datetime.fromisoformat(last)
            if datetime.now(timezone.utc) - last.replace(tzinfo=timezone.utc) < timedelta(minutes=15):
                raise HTTPException(status_code=429, detail="Too many attempts. Try again in 15 minutes.")
            else:
                await db.login_attempts.delete_one({"identifier": identifier})
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(data.password, user["password_hash"]):
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"attempts": 1}, "$set": {"last_attempt": datetime.now(timezone.utc).isoformat()}},
            upsert=True
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")
    await db.login_attempts.delete_many({"identifier": identifier})
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    set_auth_cookies(response, access_token, refresh_token)
    return {"id": user_id, "name": user["name"], "email": user["email"], "role": user["role"], "token": access_token}

@auth_router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out"}

@auth_router.get("/me")
async def get_me(request: Request):
    return await get_current_user(request)

@auth_router.post("/refresh")
async def refresh(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        access_token = create_access_token(str(user["_id"]), user["email"])
        response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
        return {"message": "Token refreshed", "token": access_token}
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        raise HTTPException(status_code=401, detail="Invalid refresh token")

# ============================================================
# CROP ROUTES
# ============================================================

@crop_router.post("/predict")
async def crop_predict(request: Request, data: CropPredictRequest):
    user = await get_current_user(request)
    result = predict_crop(data.nitrogen, data.phosphorus, data.potassium, data.temperature, data.humidity, data.ph, data.rainfall)
    await db.crop_predictions.insert_one({
        "user_id": user["_id"], "inputs": data.model_dump(),
        "predicted_crop": result["recommended_crop"], "confidence": result["confidence"],
        "top_recommendations": result["top_recommendations"],
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    return result

# ============================================================
# WEATHER ROUTES (MOCKED - no OpenWeatherMap key)
# ============================================================

@weather_router.get("/current")
async def get_current_weather(request: Request):
    await get_current_user(request)
    rng = random.Random(int(datetime.now(timezone.utc).strftime('%Y%m%d%H')))
    conditions = ["Sunny", "Partly Cloudy", "Cloudy", "Light Rain", "Clear"]
    temp = round(rng.uniform(20, 35), 1)
    return {
        "temperature": temp, "feels_like": round(temp + rng.uniform(-2, 3), 1),
        "humidity": round(rng.uniform(40, 85), 1),
        "wind_speed": round(rng.uniform(3, 18), 1),
        "wind_direction": rng.choice(["N", "NE", "E", "SE", "S", "SW", "W", "NW"]),
        "condition": rng.choice(conditions),
        "pressure": round(rng.uniform(1008, 1022), 1),
        "visibility": round(rng.uniform(6, 15), 1),
        "uv_index": rng.randint(2, 10),
        "rain_probability": rng.randint(0, 70),
        "location": "Farm Region",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@weather_router.get("/forecast")
async def get_forecast(request: Request):
    await get_current_user(request)
    forecasts = []
    for i in range(5):
        day = datetime.now(timezone.utc) + timedelta(days=i + 1)
        rng = random.Random(int(day.strftime('%Y%m%d')))
        th = round(rng.uniform(22, 38), 1)
        forecasts.append({
            "date": day.strftime("%Y-%m-%d"), "day_name": day.strftime("%A"),
            "temp_high": th, "temp_low": round(th - rng.uniform(4, 9), 1),
            "humidity": round(rng.uniform(40, 80), 1),
            "condition": rng.choice(["Sunny", "Partly Cloudy", "Cloudy", "Light Rain", "Thunderstorm", "Clear"]),
            "rain_probability": rng.randint(0, 70),
            "wind_speed": round(rng.uniform(3, 15), 1)
        })
    return {"forecast": forecasts}

# ============================================================
# SENSOR ROUTES
# ============================================================

@sensor_router.post("/data")
async def add_sensor_data(data: SensorDataCreate):
    valid = ["soil_moisture", "temperature", "humidity", "water_level"]
    if data.sensor_type not in valid:
        raise HTTPException(status_code=400, detail=f"Invalid sensor type. Must be: {', '.join(valid)}")
    doc = {
        "sensor_type": data.sensor_type, "value": data.value, "unit": data.unit,
        "location": data.location, "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.sensor_data.insert_one(doc)
    alert = None
    if data.sensor_type == "soil_moisture" and data.value < 30:
        alert = {"type": "low_soil_moisture", "message": f"Low soil moisture: {data.value}% at {data.location}", "created_at": datetime.now(timezone.utc).isoformat(), "read": False}
    elif data.sensor_type == "temperature" and data.value > 40:
        alert = {"type": "high_temperature", "message": f"High temperature: {data.value} C at {data.location}", "created_at": datetime.now(timezone.utc).isoformat(), "read": False}
    elif data.sensor_type == "water_level" and data.value > 90:
        alert = {"type": "water_overflow", "message": f"Water tank overflow risk: {data.value}% at {data.location}", "created_at": datetime.now(timezone.utc).isoformat(), "read": False}
    if alert:
        await db.notifications.insert_one(alert)
    return {"message": "Sensor data recorded", "alert": alert}

@sensor_router.get("/latest")
async def get_latest(request: Request):
    await get_current_user(request)
    result = {}
    for st in ["soil_moisture", "temperature", "humidity", "water_level"]:
        data = await db.sensor_data.find_one({"sensor_type": st}, {"_id": 0}, sort=[("timestamp", -1)])
        result[st] = data
    return result

@sensor_router.get("/history")
async def get_history(request: Request, sensor_type: Optional[str] = None, limit: int = Query(default=50, le=200)):
    await get_current_user(request)
    query = {"sensor_type": sensor_type} if sensor_type else {}
    data = await db.sensor_data.find(query, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
    return {"data": data, "count": len(data)}

# ============================================================
# DISEASE ROUTES
# ============================================================

@disease_router.post("/predict")
async def disease_predict(request: Request, file: UploadFile = File(...)):
    user = await get_current_user(request)
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    filename = f"{uuid.uuid4()}_{file.filename}"
    with open(UPLOAD_DIR / filename, "wb") as f:
        f.write(await file.read())
    disease_keys = list(DISEASES.keys())
    idx = hash(filename) % len(disease_keys)
    disease = DISEASES[disease_keys[idx]]
    confidence = round(random.Random(hash(filename)).uniform(72, 97), 2)
    result = {"disease": disease["name"], "confidence": confidence, "severity": disease["severity"], "treatment": disease["treatment"]}
    await db.disease_reports.insert_one({
        "user_id": user["_id"], "image_path": filename,
        "disease": result["disease"], "confidence": result["confidence"],
        "severity": result["severity"], "treatment": result["treatment"],
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    return result

# ============================================================
# DASHBOARD ROUTES
# ============================================================

@dashboard_router.get("/stats")
async def get_stats(request: Request):
    await get_current_user(request)
    return {
        "total_users": await db.users.count_documents({}),
        "total_sensor_readings": await db.sensor_data.count_documents({}),
        "total_crop_predictions": await db.crop_predictions.count_documents({}),
        "unread_notifications": await db.notifications.count_documents({"read": False}),
        "total_disease_reports": await db.disease_reports.count_documents({}),
    }

@dashboard_router.get("/crops")
async def get_dashboard_crops(request: Request):
    await get_current_user(request)
    predictions = await db.crop_predictions.find({}, {"_id": 0, "user_id": 0}).sort("created_at", -1).limit(10).to_list(10)
    pipeline = [{"$group": {"_id": "$predicted_crop", "count": {"$sum": 1}}}, {"$sort": {"count": -1}}, {"$limit": 10}]
    dist = await db.crop_predictions.aggregate(pipeline).to_list(10)
    return {"recent_predictions": predictions, "crop_distribution": [{"crop": d["_id"], "count": d["count"]} for d in dist]}

@dashboard_router.get("/sensors")
async def get_dashboard_sensors(request: Request):
    await get_current_user(request)
    result = {}
    for st in ["soil_moisture", "temperature", "humidity", "water_level"]:
        pipeline = [{"$match": {"sensor_type": st}}, {"$group": {"_id": None, "avg": {"$avg": "$value"}, "min": {"$min": "$value"}, "max": {"$max": "$value"}, "count": {"$sum": 1}}}]
        agg = await db.sensor_data.aggregate(pipeline).to_list(1)
        result[st] = {"average": round(agg[0]["avg"], 1), "min": agg[0]["min"], "max": agg[0]["max"], "count": agg[0]["count"]} if agg else {"average": 0, "min": 0, "max": 0, "count": 0}
    return result

# ============================================================
# NOTIFICATION ROUTES
# ============================================================

@notification_router.get("")
async def get_notifications(request: Request, limit: int = Query(default=30, le=100)):
    await get_current_user(request)
    cursor = db.notifications.find({}).sort("created_at", -1).limit(limit)
    notifications = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        notifications.append(doc)
    return {"notifications": notifications, "count": len(notifications)}

@notification_router.put("/{nid}/read")
async def mark_read(nid: str, request: Request):
    await get_current_user(request)
    result = await db.notifications.update_one({"_id": ObjectId(nid)}, {"$set": {"read": True}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Marked as read"}

@notification_router.put("/read-all")
async def mark_all_read(request: Request):
    await get_current_user(request)
    await db.notifications.update_many({"read": False}, {"$set": {"read": True}})
    return {"message": "All marked as read"}

# ============================================================
# USER ROUTES (Admin)
# ============================================================

@user_router.get("")
async def get_users(request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    cursor = db.users.find({}, {"password_hash": 0})
    users = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        users.append(doc)
    return {"users": users}

@user_router.delete("/{user_id}")
async def delete_user(user_id: str, request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    if user_id == user["_id"]:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    result = await db.users.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted"}

# ============================================================
# ROOT / HEALTH
# ============================================================

@app.get("/api")
async def root():
    return {"message": "Smart Farming API", "version": "1.0.0"}

@app.get("/api/health")
async def health():
    return {"status": "ok"}

# Include routers
for router in [auth_router, crop_router, weather_router, sensor_router, disease_router, dashboard_router, notification_router, user_router]:
    app.include_router(router)

# ============================================================
# STARTUP / SHUTDOWN
# ============================================================

@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.sensor_data.create_index([("sensor_type", 1), ("timestamp", -1)])
    await db.notifications.create_index("created_at")

    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@example.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "email": admin_email, "password_hash": hash_password(admin_password),
            "name": "Admin", "role": "admin", "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info(f"Admin seeded: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})

    # Load ML model
    load_crop_model()

    # Seed sensor data if empty
    if await db.sensor_data.count_documents({}) == 0:
        sensors = [("soil_moisture", "%", 25, 75), ("temperature", "C", 18, 38), ("humidity", "%", 35, 90), ("water_level", "%", 15, 95)]
        for st, unit, lo, hi in sensors:
            for i in range(15):
                await db.sensor_data.insert_one({
                    "sensor_type": st, "value": round(random.uniform(lo, hi), 1), "unit": unit,
                    "location": f"Field {random.randint(1, 5)}",
                    "timestamp": (datetime.now(timezone.utc) - timedelta(hours=i * 3)).isoformat()
                })
        logger.info("Seeded initial sensor data")

    # Write test credentials
    os.makedirs("/app/memory", exist_ok=True)
    with open("/app/memory/test_credentials.md", "w") as f:
        f.write(f"# Test Credentials\n\n## Admin\n- Email: {admin_email}\n- Password: {admin_password}\n- Role: admin\n\n## Auth Endpoints\n- POST /api/auth/register\n- POST /api/auth/login\n- POST /api/auth/logout\n- GET /api/auth/me\n- POST /api/auth/refresh\n")

    logger.info("Smart Farming API started successfully")

@app.on_event("shutdown")
async def shutdown():
    client.close()
