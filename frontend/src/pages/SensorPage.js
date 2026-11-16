import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Plus, Droplets, Thermometer, Wind, Waves, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';

const SENSOR_TYPES = [
  { value: 'soil_moisture', label: 'Soil Moisture', icon: Droplets, unit: '%', color: '#1B4332' },
  { value: 'temperature', label: 'Temperature', icon: Thermometer, unit: 'C', color: '#E07A5F' },
  { value: 'humidity', label: 'Humidity', icon: Wind, unit: '%', color: '#457B9D' },
  { value: 'water_level', label: 'Water Level', icon: Waves, unit: '%', color: '#D4A373' },
];

export default function SensorPage() {
  const [data, setData] = useState([]);
  const [latest, setLatest] = useState({});
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ sensor_type: 'soil_moisture', value: '', location: '' });

  const fetchData = useCallback(async () => {
    try {
      const params = filter !== 'all' ? `?sensor_type=${filter}&limit=100` : '?limit=100';
      const [h, l] = await Promise.all([api.get(`/sensor/history${params}`), api.get('/sensor/latest')]);
      setData(h.data.data || []);
      setLatest(l.data || {});
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdd = async (e) => {
    e.preventDefault();
    const val = parseFloat(form.value);
    if (isNaN(val)) { toast.error('Invalid value'); return; }
    const stype = SENSOR_TYPES.find(s => s.value === form.sensor_type);
    try {
      const { data: res } = await api.post('/sensor/data', {
        sensor_type: form.sensor_type, value: val, unit: stype?.unit || '', location: form.location || 'Field 1'
      });
      toast.success('Sensor data recorded');
      if (res.alert) toast.warning(res.alert.message);
      setDialogOpen(false);
      setForm({ sensor_type: 'soil_moisture', value: '', location: '' });
      fetchData();
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to add data'); }
  };

  const getSensorMeta = (type) => SENSOR_TYPES.find(s => s.value === type) || SENSOR_TYPES[0];

  if (loading) return <div className="p-8 flex justify-center"><div className="loading-spinner" /></div>;

  return (
    <div className="p-6 lg:p-8 space-y-6" data-testid="sensor-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1E293B] tracking-tight">Sensor Data</h1>
          <p className="text-sm text-[#475569] mt-1">Monitor IoT sensor readings from your fields</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} data-testid="sensor-refresh-btn" className="border-[#E2E8F0] text-[#475569]">
            <RefreshCw size={14} className="mr-1" /> Refresh
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="sensor-add-btn" className="bg-[#1B4332] hover:bg-[#2D6A4F] text-white">
                <Plus size={14} className="mr-1" /> Add Reading
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border border-[#E2E8F0]">
              <DialogHeader><DialogTitle className="text-[#1E293B]">Add Sensor Reading</DialogTitle></DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-sm text-[#1E293B]">Sensor Type</Label>
                  <Select value={form.sensor_type} onValueChange={(v) => setForm({ ...form, sensor_type: v })}>
                    <SelectTrigger data-testid="sensor-type-select" className="border-[#E2E8F0]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SENSOR_TYPES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-[#1E293B]">Value</Label>
                  <Input data-testid="sensor-value-input" type="number" step="any" placeholder="e.g. 45.2" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required className="border-[#E2E8F0]" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-[#1E293B]">Location</Label>
                  <Input data-testid="sensor-location-input" placeholder="e.g. Field 1" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="border-[#E2E8F0]" />
                </div>
                <Button type="submit" data-testid="sensor-submit-btn" className="w-full bg-[#1B4332] hover:bg-[#2D6A4F] text-white">Submit Reading</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {SENSOR_TYPES.map((s) => {
          const val = latest[s.value];
          const Icon = s.icon;
          return (
            <Card key={s.value} className="border border-[#E2E8F0] shadow-none" data-testid={`sensor-latest-${s.value}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={16} style={{ color: s.color }} strokeWidth={1.5} />
                  <span className="text-xs uppercase tracking-wider text-[#94A3B8]">{s.label}</span>
                </div>
                <p className="text-xl font-bold text-[#1E293B]">{val ? `${val.value}${s.unit}` : '--'}</p>
                {val && <p className="text-[10px] text-[#94A3B8] mt-1">{val.location} &middot; {new Date(val.timestamp).toLocaleString()}</p>}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border border-[#E2E8F0] shadow-none">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold text-[#1E293B]">Readings History</CardTitle>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger data-testid="sensor-filter-select" className="w-40 border-[#E2E8F0] text-sm"><SelectValue placeholder="Filter" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {SENSOR_TYPES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[#E2E8F0]">
                  <TableHead className="text-[10px] uppercase tracking-wider text-[#94A3B8] font-medium">Type</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-[#94A3B8] font-medium">Value</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-[#94A3B8] font-medium">Location</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-[#94A3B8] font-medium">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-sm text-[#94A3B8] py-8">No sensor data found</TableCell></TableRow>
                ) : data.map((row, i) => {
                  const meta = getSensorMeta(row.sensor_type);
                  return (
                    <TableRow key={i} className="border-[#E2E8F0] hover:bg-[#F3F2EE]">
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize" style={{ borderColor: meta.color + '40', color: meta.color }}>
                          {row.sensor_type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-[#1E293B]">{row.value} {row.unit}</TableCell>
                      <TableCell className="text-sm text-[#475569]">{row.location}</TableCell>
                      <TableCell className="text-sm text-[#94A3B8]">{new Date(row.timestamp).toLocaleString()}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
