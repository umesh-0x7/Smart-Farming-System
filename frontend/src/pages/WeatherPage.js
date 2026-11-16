import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Cloud, CloudRain, Sun, CloudSun, Zap, Droplets, Wind, Eye, Thermometer, Gauge } from 'lucide-react';
import api from '../lib/api';

const conditionIcon = (c) => {
  if (!c) return Sun;
  const lower = c.toLowerCase();
  if (lower.includes('rain')) return CloudRain;
  if (lower.includes('cloud')) return CloudSun;
  if (lower.includes('thunder')) return Zap;
  if (lower.includes('clear') || lower.includes('sunny')) return Sun;
  return Cloud;
};

export default function WeatherPage() {
  const [current, setCurrent] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [c, f] = await Promise.all([api.get('/weather/current'), api.get('/weather/forecast')]);
        setCurrent(c.data);
        setForecast(f.data.forecast || []);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <div className="p-8 flex justify-center"><div className="loading-spinner" /></div>;

  const Icon = current ? conditionIcon(current.condition) : Sun;

  return (
    <div className="p-6 lg:p-8 space-y-6" data-testid="weather-page">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1E293B] tracking-tight">Weather Monitoring</h1>
        <p className="text-sm text-[#475569] mt-1">Current conditions and 5-day forecast for your farm region</p>
        <Badge variant="outline" className="mt-2 text-[10px] uppercase tracking-wider border-[#D4A373] text-[#D4A373]">MOCKED Data</Badge>
      </div>

      {current && (
        <Card className="border border-[#E2E8F0] shadow-none animate-fade-in-up stagger-1">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-md bg-[#1B4332]/8 flex items-center justify-center">
                  <Icon size={32} className="text-[#1B4332]" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-4xl font-bold text-[#1E293B]">{current.temperature}°C</p>
                  <p className="text-sm text-[#475569]">{current.condition}</p>
                  <p className="text-xs text-[#94A3B8]">Feels like {current.feels_like}°C</p>
                </div>
              </div>
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-4 md:pl-6 md:border-l border-[#E2E8F0]">
                {[
                  { icon: Droplets, label: 'Humidity', value: `${current.humidity}%`, color: '#457B9D' },
                  { icon: Wind, label: 'Wind', value: `${current.wind_speed} km/h ${current.wind_direction}`, color: '#52796F' },
                  { icon: CloudRain, label: 'Rain Chance', value: `${current.rain_probability}%`, color: '#D4A373' },
                  { icon: Gauge, label: 'Pressure', value: `${current.pressure} hPa`, color: '#475569' },
                  { icon: Eye, label: 'Visibility', value: `${current.visibility} km`, color: '#94A3B8' },
                  { icon: Thermometer, label: 'UV Index', value: current.uv_index, color: '#E07A5F' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <item.icon size={15} style={{ color: item.color }} strokeWidth={1.5} />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-[#94A3B8]">{item.label}</p>
                      <p className="text-sm font-medium text-[#1E293B]">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-lg font-semibold text-[#1E293B] mb-4">5-Day Forecast</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {forecast.map((day, i) => {
            const DayIcon = conditionIcon(day.condition);
            return (
              <Card key={i} className={`border border-[#E2E8F0] shadow-none hover:-translate-y-px hover:shadow-sm transition-all duration-200 animate-fade-in-up stagger-${i + 1}`} data-testid={`forecast-day-${i}`}>
                <CardContent className="p-4 text-center">
                  <p className="text-xs font-semibold text-[#1E293B] uppercase tracking-wider">{day.day_name}</p>
                  <p className="text-[10px] text-[#94A3B8] mb-3">{day.date}</p>
                  <DayIcon size={28} className="mx-auto text-[#52796F] mb-3" strokeWidth={1.5} />
                  <p className="text-sm text-[#475569]">{day.condition}</p>
                  <div className="flex justify-center gap-3 mt-2">
                    <span className="text-sm font-semibold text-[#1E293B]">{day.temp_high}°</span>
                    <span className="text-sm text-[#94A3B8]">{day.temp_low}°</span>
                  </div>
                  <div className="flex justify-center gap-2 mt-2 text-[10px] text-[#94A3B8]">
                    <span>{day.rain_probability}% rain</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
