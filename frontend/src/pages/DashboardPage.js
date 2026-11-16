import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Users, Activity, Sprout, Bell, Droplets, Thermometer, Wind, CloudRain } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../lib/api';

const STATS = [
  { key: 'total_users', label: 'Total Users', icon: Users, color: '#1B4332' },
  { key: 'total_sensor_readings', label: 'Sensor Readings', icon: Activity, color: '#457B9D' },
  { key: 'total_crop_predictions', label: 'Crop Predictions', icon: Sprout, color: '#D4A373' },
  { key: 'unread_notifications', label: 'Active Alerts', icon: Bell, color: '#E07A5F' },
];

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [s, h, w] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/sensor/history?limit=60'),
          api.get('/weather/current'),
        ]);
        setStats(s.data);
        setWeather(w.data);
        const grouped = {};
        (h.data.data || []).reverse().forEach(d => {
          const t = new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          if (!grouped[t]) grouped[t] = { time: t };
          grouped[t][d.sensor_type] = d.value;
        });
        setChartData(Object.values(grouped).slice(-15));
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <div className="p-8 flex justify-center"><div className="loading-spinner" /></div>;

  return (
    <div className="p-6 lg:p-8 space-y-6" data-testid="dashboard-page">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1E293B] tracking-tight">Dashboard</h1>
        <p className="text-sm text-[#475569] mt-1">Overview of your farming operations</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s, i) => {
          const Icon = s.icon;
          return (
            <Card key={s.key} className={`border border-[#E2E8F0] shadow-none hover:-translate-y-px hover:shadow-sm transition-all duration-200 animate-fade-in-up stagger-${i + 1}`} data-testid={`stat-${s.key}`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[#94A3B8] font-medium">{s.label}</p>
                    <p className="text-2xl font-bold text-[#1E293B] mt-1">{stats?.[s.key] ?? 0}</p>
                  </div>
                  <div className="w-10 h-10 rounded-md flex items-center justify-center" style={{ backgroundColor: s.color + '14' }}>
                    <Icon size={20} style={{ color: s.color }} strokeWidth={1.5} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border border-[#E2E8F0] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-[#1E293B]">Sensor Trends</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <Tooltip contentStyle={{ borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="soil_moisture" stroke="#1B4332" strokeWidth={2} dot={false} name="Soil Moisture %" />
                  <Line type="monotone" dataKey="temperature" stroke="#E07A5F" strokeWidth={2} dot={false} name="Temperature" />
                  <Line type="monotone" dataKey="humidity" stroke="#457B9D" strokeWidth={2} dot={false} name="Humidity %" />
                  <Line type="monotone" dataKey="water_level" stroke="#D4A373" strokeWidth={2} dot={false} name="Water Level %" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-[#94A3B8] text-center py-16">No sensor data available yet</p>
            )}
          </CardContent>
        </Card>

        <Card className="border border-[#E2E8F0] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-[#1E293B]">Current Weather</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {weather ? (
              <>
                <div className="text-center py-2">
                  <p className="text-4xl font-bold text-[#1E293B]">{weather.temperature}°C</p>
                  <p className="text-sm text-[#475569] mt-1">{weather.condition}</p>
                  <p className="text-xs text-[#94A3B8]">Feels like {weather.feels_like}°C</p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E2E8F0]">
                  <div className="flex items-center gap-2">
                    <Droplets size={14} className="text-[#457B9D]" strokeWidth={1.5} />
                    <span className="text-sm text-[#475569]">{weather.humidity}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wind size={14} className="text-[#52796F]" strokeWidth={1.5} />
                    <span className="text-sm text-[#475569]">{weather.wind_speed} km/h</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CloudRain size={14} className="text-[#D4A373]" strokeWidth={1.5} />
                    <span className="text-sm text-[#475569]">{weather.rain_probability}% rain</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Thermometer size={14} className="text-[#E07A5F]" strokeWidth={1.5} />
                    <span className="text-sm text-[#475569]">UV {weather.uv_index}</span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-[#94A3B8] text-center py-8">Weather unavailable</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
