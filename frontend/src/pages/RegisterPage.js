import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Leaf, ArrowRight } from 'lucide-react';

const HERO_IMG = "https://images.pexels.com/photos/5230961/pexels-photo-5230961.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'farmer' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setError('');
    setLoading(true);
    const result = await register(form.name, form.email, form.password, form.role);
    setLoading(false);
    if (result.success) navigate('/');
    else setError(result.error);
  };

  return (
    <div className="min-h-screen flex" data-testid="register-page">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img src={HERO_IMG} alt="Greenhouse" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[#1B4332]/75" />
        <div className="relative z-10 flex flex-col justify-end p-12 text-white">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4" style={{ fontFamily: 'Manrope' }}>
            Join the Future of Farming
          </h1>
          <p className="text-base text-white/80 max-w-md leading-relaxed">
            Create your account and start leveraging AI-powered insights for better crop yields and smarter resource management.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-[#F9F8F6]">
        <Card className="w-full max-w-md border border-[#E2E8F0] shadow-none rounded-md">
          <CardHeader className="space-y-1 pb-4">
            <div className="lg:hidden flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-md bg-[#1B4332] flex items-center justify-center">
                <Leaf className="text-white" size={16} strokeWidth={1.5} />
              </div>
              <span className="text-base font-bold text-[#1E293B]" style={{ fontFamily: 'Manrope' }}>SmartFarm</span>
            </div>
            <CardTitle className="text-2xl font-bold text-[#1E293B]">Create Account</CardTitle>
            <CardDescription className="text-sm text-[#475569]">Start your smart farming journey</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-md bg-[#E07A5F]/10 border border-[#E07A5F]/20 text-sm text-[#E07A5F]" data-testid="register-error">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#1E293B]">Full Name</Label>
                <Input
                  data-testid="register-name-input"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="border-[#E2E8F0] bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#1E293B]">Email</Label>
                <Input
                  data-testid="register-email-input"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="border-[#E2E8F0] bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#1E293B]">Password</Label>
                <Input
                  data-testid="register-password-input"
                  type="password"
                  placeholder="Min 6 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  className="border-[#E2E8F0] bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#1E293B]">Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })} data-testid="register-role-select">
                  <SelectTrigger data-testid="register-role-trigger" className="border-[#E2E8F0] bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="farmer">Farmer</SelectItem>
                    <SelectItem value="agriculture_officer">Agriculture Officer</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                data-testid="register-submit-btn"
                disabled={loading}
                className="w-full bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-md"
              >
                {loading ? 'Creating account...' : 'Create Account'}
                {!loading && <ArrowRight size={16} className="ml-2" />}
              </Button>
              <p className="text-sm text-center text-[#475569]">
                Already have an account?{' '}
                <Link to="/login" data-testid="goto-login-link" className="text-[#1B4332] font-medium hover:text-[#2D6A4F]">
                  Sign in
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
