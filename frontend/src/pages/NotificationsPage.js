import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Bell, Droplets, Thermometer, AlertTriangle, CheckCircle2, Waves } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';

const typeConfig = {
  low_soil_moisture: { icon: Droplets, color: '#1B4332', label: 'Soil Moisture' },
  high_temperature: { icon: Thermometer, color: '#E07A5F', label: 'Temperature' },
  water_overflow: { icon: Waves, color: '#457B9D', label: 'Water Level' },
  rain_warning: { icon: AlertTriangle, color: '#E9C46A', label: 'Rain Warning' },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) { toast.error('Failed to mark as read'); }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch (err) { toast.error('Failed'); }
  };

  const unread = notifications.filter(n => !n.read).length;

  if (loading) return <div className="p-8 flex justify-center"><div className="loading-spinner" /></div>;

  return (
    <div className="p-6 lg:p-8 space-y-6" data-testid="notifications-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1E293B] tracking-tight">Notifications</h1>
          <p className="text-sm text-[#475569] mt-1">{unread} unread alert{unread !== 1 ? 's' : ''}</p>
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead} data-testid="mark-all-read-btn" className="border-[#E2E8F0] text-[#475569]">
            <CheckCircle2 size={14} className="mr-1" /> Mark All Read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="border border-[#E2E8F0] shadow-none">
          <CardContent className="py-16 text-center">
            <Bell size={40} className="mx-auto text-[#E2E8F0] mb-3" strokeWidth={1} />
            <p className="text-sm text-[#94A3B8]">No notifications yet. Alerts will appear when sensor thresholds are exceeded.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n, i) => {
            const cfg = typeConfig[n.type] || { icon: Bell, color: '#475569', label: n.type };
            const Icon = cfg.icon;
            return (
              <Card
                key={n.id || i}
                className={`border shadow-none transition-all duration-200 ${n.read ? 'border-[#E2E8F0] opacity-70' : 'border-[#E2E8F0] bg-white'}`}
                data-testid={`notification-${n.id || i}`}
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cfg.color + '14' }}>
                    <Icon size={17} style={{ color: cfg.color }} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wider" style={{ borderColor: cfg.color + '40', color: cfg.color }}>
                        {cfg.label}
                      </Badge>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-[#E07A5F]" />}
                    </div>
                    <p className="text-sm text-[#1E293B]">{n.message}</p>
                    <p className="text-[10px] text-[#94A3B8] mt-1">{n.created_at ? new Date(n.created_at).toLocaleString() : ''}</p>
                  </div>
                  {!n.read && (
                    <Button variant="ghost" size="sm" onClick={() => markRead(n.id)} data-testid={`mark-read-${n.id || i}`} className="text-xs text-[#475569]">
                      Mark Read
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
