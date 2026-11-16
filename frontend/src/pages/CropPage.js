import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Sprout, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';

const FIELDS = [
  { key: 'nitrogen', label: 'Nitrogen (N)', placeholder: '0-140', unit: 'mg/kg' },
  { key: 'phosphorus', label: 'Phosphorus (P)', placeholder: '5-145', unit: 'mg/kg' },
  { key: 'potassium', label: 'Potassium (K)', placeholder: '5-205', unit: 'mg/kg' },
  { key: 'temperature', label: 'Temperature', placeholder: '8-44', unit: '°C' },
  { key: 'humidity', label: 'Humidity', placeholder: '14-100', unit: '%' },
  { key: 'ph', label: 'pH Level', placeholder: '3.5-9.9', unit: '' },
  { key: 'rainfall', label: 'Rainfall', placeholder: '20-300', unit: 'mm' },
];

const defaults = { nitrogen: '', phosphorus: '', potassium: '', temperature: '', humidity: '', ph: '', rainfall: '' };

export default function CropPage() {
  const [form, setForm] = useState(defaults);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const payload = {};
      for (const f of FIELDS) {
        const val = parseFloat(form[f.key]);
        if (isNaN(val)) { toast.error(`Invalid value for ${f.label}`); setLoading(false); return; }
        payload[f.key] = val;
      }
      const { data } = await api.post('/crop/predict', payload);
      setResult(data);
      toast.success(`Recommended: ${data.recommended_crop}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Prediction failed');
    }
    setLoading(false);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6" data-testid="crop-page">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1E293B] tracking-tight">Crop Recommendation</h1>
        <p className="text-sm text-[#475569] mt-1">Enter soil and environmental parameters for AI-powered crop suggestions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3 border border-[#E2E8F0] shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-[#1E293B]">Input Parameters</CardTitle>
            <CardDescription className="text-sm text-[#94A3B8]">Provide soil nutrient levels and weather conditions</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {FIELDS.map((f) => (
                  <div key={f.key} className="space-y-1.5">
                    <Label className="text-sm font-medium text-[#1E293B]">{f.label}</Label>
                    <div className="relative">
                      <Input
                        data-testid={`crop-input-${f.key}`}
                        type="number"
                        step="any"
                        placeholder={f.placeholder}
                        value={form[f.key]}
                        onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                        required
                        className="border-[#E2E8F0] bg-white pr-12"
                      />
                      {f.unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#94A3B8]">{f.unit}</span>}
                    </div>
                  </div>
                ))}
              </div>
              <Button
                type="submit"
                data-testid="crop-predict-btn"
                disabled={loading}
                className="bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-md"
              >
                {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : <Sprout size={16} className="mr-2" />}
                {loading ? 'Analyzing...' : 'Get Recommendation'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border border-[#E2E8F0] shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-[#1E293B]">Prediction Result</CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center p-6 bg-[#1B4332]/5 rounded-md border border-[#1B4332]/10">
                  <Sprout size={32} className="mx-auto text-[#1B4332] mb-2" strokeWidth={1.5} />
                  <p className="text-xs uppercase tracking-[0.15em] text-[#94A3B8] mb-1">Recommended Crop</p>
                  <p className="text-2xl font-bold text-[#1B4332] capitalize" data-testid="crop-result-name">{result.recommended_crop}</p>
                  <p className="text-sm text-[#475569] mt-1">Confidence: {result.confidence}%</p>
                  <Progress value={result.confidence} className="mt-3 h-2" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-[#94A3B8] mb-3">Top Recommendations</p>
                  <div className="space-y-2">
                    {result.top_recommendations?.map((r, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-[#F3F2EE] rounded-md">
                        <span className="text-sm font-medium text-[#1E293B] capitalize">{r.crop}</span>
                        <span className="text-sm text-[#475569]">{r.confidence}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <Sprout size={40} className="mx-auto text-[#E2E8F0] mb-3" strokeWidth={1} />
                <p className="text-sm text-[#94A3B8]">Enter parameters and click predict to see results</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
