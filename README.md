# Smart Farming System

A full-stack AI-powered farming dashboard featuring crop recommendation, weather monitoring, IoT sensor data, plant-disease detection, role-based authentication, and admin user management.

**Stack:** FastAPI · MongoDB (Motor) · scikit-learn · React 19 · Tailwind CSS · shadcn/ui · Recharts

---

## Prerequisites

| Tool        | Version  |
|-------------|----------|
| Python      | 3.10+    |
| Node.js     | 18+      |
| Yarn        | 1.22+    |
| MongoDB     | 5.0+ (running on `mongodb://localhost:27017`) |

Optional but recommended VS Code extensions:
- Python (ms-python.python)
- Pylance
- ESLint (dbaeumer.vscode-eslint)
- Tailwind CSS IntelliSense (bradlc.vscode-tailwindcss)

---

## Project Structure

```
smart-farming-system/
├── backend/
│   ├── server.py              # FastAPI app (auth, crop, weather, sensor, disease, dashboard)
│   ├── requirements.txt
│   ├── .env                   # Mongo URL, JWT secret, admin seed creds
│   ├── models/                # Trained ML pickle files (auto-generated)
│   └── uploads/               # Uploaded disease images
├── frontend/
│   ├── public/index.html
│   ├── src/
│   │   ├── App.js, index.js, index.css, App.css
│   │   ├── contexts/AuthContext.js
│   │   ├── lib/{api.js, utils.js}
│   │   ├── components/{Sidebar.js, ui/*.jsx}
│   │   └── pages/{Login,Register,Dashboard,Crop,Weather,Sensor,Disease,Notifications,Users}Page.js
│   ├── package.json
│   ├── tailwind.config.js · postcss.config.js · craco.config.js
│   ├── jsconfig.json · components.json
│   └── .env                   # REACT_APP_BACKEND_URL
├── design_guidelines.json
├── .vscode/launch.json
└── README.md
```

---

## Setup

### 1. Clone / unzip and open in VS Code
```bash
cd smart-farming-system
code .
```

### 2. Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Review `backend/.env` (defaults already provided):
```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="smart_farming"
CORS_ORIGINS="http://localhost:3000"
JWT_SECRET="change-me-in-production"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="admin123"
```

Start MongoDB locally, then run the API:
```bash
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```
API will be available at `http://localhost:8001/api`. Swagger UI at `http://localhost:8001/docs`.

### 3. Frontend
In a new terminal:
```bash
cd frontend
yarn install
```

Edit `frontend/.env` and point it to your local backend:
```env
REACT_APP_BACKEND_URL=http://localhost:8001
WDS_SOCKET_PORT=0
```

Then start:
```bash
yarn start
```
App runs at `http://localhost:3000`.

---

## Default Login

On first backend boot, an admin user is seeded:

| Email                | Password   | Role  |
|----------------------|------------|-------|
| `admin@example.com`  | `admin123` | admin |

Other users can self-register from the **Register** page (default role: `farmer`).

---

## Key Features

- **JWT auth** with bcrypt hashing, role-based access (`farmer`, `admin`, `agriculture_officer`)
- **Crop recommendation** — Random-Forest model trained on synthetic NPK/climate data for 20 crops
- **Weather dashboard** — current + 5-day forecast (mock data, hook in real provider easily)
- **IoT sensor management** — soil moisture, temperature, humidity, water-level readings + history
- **Disease detection** — image upload + simulated diagnosis with treatment suggestions
- **Notifications** — auto-generated alerts on threshold breaches
- **Admin user management** — list/delete users

---

## VS Code Run/Debug

`.vscode/launch.json` ships two configurations:
1. **Python: FastAPI** — debug the backend with breakpoints
2. **Chrome: React** — attach to the running CRA dev server

Run both together via *Compounds → Full Stack*.

---

## API Quick Reference

```
POST  /api/auth/register
POST  /api/auth/login
GET   /api/auth/me
POST  /api/auth/logout
POST  /api/auth/refresh

POST  /api/crop/predict

GET   /api/weather/current
GET   /api/weather/forecast

POST  /api/sensor/data
GET   /api/sensor/latest
GET   /api/sensor/history

POST  /api/disease/predict   # multipart image upload

GET   /api/dashboard/stats
GET   /api/dashboard/crops
GET   /api/dashboard/sensors

GET   /api/notifications
PUT   /api/notifications/{id}/read
PUT   /api/notifications/read-all

GET   /api/users             # admin
DELETE /api/users/{id}       # admin
```

---

## Notes

- The ML crop model is auto-trained on first prediction and cached to `backend/models/crop_model.pkl`.
- Disease detection is **simulated** — swap in a real CV model in `predict_disease()` inside `server.py`.
- Weather data is **mocked** — replace `weather_current()` and `weather_forecast()` with an API (OpenWeather, etc.) when ready.
