import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Upload, Loader2, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';

const HEALTHY_IMG = "https://static.prod-images.emergentagent.com/jobs/84ea87d1-7996-44f6-9806-e7412781826a/images/1542ec887a009666446c809d5da7442067cd7dcd28bddb20ca0b63a922a428cb.png";
const DISEASED_IMG = "https://static.prod-images.emergentagent.com/jobs/84ea87d1-7996-44f6-9806-e7412781826a/images/4db43dd0191a6bbac0b02aaea5dc9f8750ce3da1fecad6cd9f0cc2900e4adf21.png";

const severityConfig = {
  none: { color: '#40916C', bg: '#40916C14', label: 'Healthy', icon: CheckCircle },
  medium: { color: '#E9C46A', bg: '#E9C46A14', label: 'Medium', icon: AlertTriangle },
  high: { color: '#E07A5F', bg: '#E07A5F14', label: 'High', icon: AlertTriangle },
  critical: { color: '#E07A5F', bg: '#E07A5F14', label: 'Critical', icon: ShieldAlert },
};

export default function DiseasePage() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileRef = useRef(null);

  const handleUpload = async (file) => {
    if (!file || !file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/disease/predict', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(data);
      toast.success('Analysis complete');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Analysis failed');
    }
    setLoading(false);
  };

  const sev = result ? severityConfig[result.severity] || severityConfig.medium : null;

  return (
    <div className="p-6 lg:p-8 space-y-6" data-testid="disease-page">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1E293B] tracking-tight">Disease Detection</h1>
        <p className="text-sm text-[#475569] mt-1">Upload a crop leaf image for AI-powered disease analysis</p>
        <Badge variant="outline" className="mt-2 text-[10px] uppercase tracking-wider border-[#D4A373] text-[#D4A373]">Simulated Model</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card className="border border-[#E2E8F0] shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-[#1E293B]">Upload Image</CardTitle>
              <CardDescription className="text-sm text-[#94A3B8]">Take a clear photo of the affected leaf</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                data-testid="disease-upload-area"
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-[#E2E8F0] rounded-md p-8 text-center cursor-pointer hover:border-[#1B4332]/40 hover:bg-[#1B4332]/3 transition-colors duration-200"
              >
                {preview ? (
                  <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-md object-contain" />
                ) : (
                  <>
                    <Upload size={32} className="mx-auto text-[#94A3B8] mb-3" strokeWidth={1.5} />
                    <p className="text-sm text-[#475569]">Click to upload or drag a leaf image</p>
                    <p className="text-xs text-[#94A3B8] mt-1">JPG, PNG up to 10MB</p>
                  </>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                data-testid="disease-file-input"
                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
              />
              {loading && (
                <div className="flex items-center justify-center gap-2 mt-4 text-sm text-[#475569]">
                  <Loader2 size={16} className="animate-spin" /> Analyzing image...
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-[#E2E8F0] shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-[#1E293B]">Example Images</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <img src={HEALTHY_IMG} alt="Healthy leaf" className="w-full h-28 object-cover rounded-md border border-[#E2E8F0]" />
                  <p className="text-xs text-[#40916C] font-medium mt-1">Healthy Leaf</p>
                </div>
                <div className="text-center">
                  <img src={DISEASED_IMG} alt="Diseased leaf" className="w-full h-28 object-cover rounded-md border border-[#E2E8F0]" />
                  <p className="text-xs text-[#E07A5F] font-medium mt-1">Diseased Leaf</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-[#E2E8F0] shadow-none h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-[#1E293B]">Analysis Result</CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-5 animate-fade-in">
                <div className="p-5 rounded-md" style={{ backgroundColor: sev?.bg }}>
                  <div className="flex items-center gap-2 mb-2">
                    {sev?.icon && <sev.icon size={18} style={{ color: sev.color }} />}
                    <Badge style={{ backgroundColor: sev?.color, color: 'white' }} className="text-xs">{sev?.label}</Badge>
                  </div>
                  <p className="text-xl font-bold text-[#1E293B]" data-testid="disease-result-name">{result.disease}</p>
                  <p className="text-sm text-[#475569] mt-1">Confidence: {result.confidence}%</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-[#94A3B8] mb-2">Treatment Recommendations</p>
                  <div className="p-4 bg-[#F3F2EE] rounded-md">
                    <p className="text-sm text-[#1E293B] leading-relaxed" data-testid="disease-treatment">{result.treatment}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <Upload size={40} className="mx-auto text-[#E2E8F0] mb-3" strokeWidth={1} />
                <p className="text-sm text-[#94A3B8]">Upload a leaf image to see analysis results</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
