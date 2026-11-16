import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Leaf, ArrowRight } from 'lucide-react';

const HERO_IMG = "https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHw0fHxtb2Rlcm4lMjBzbWFydCUyMGFncmljdWx0dXJlJTIwZmFybSUyMHRlY2hub2xvZ3l8ZW58MHx8fHwxNzc5MTU3NjM4fDA&ixlib=rb-4.1.0&q=85";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen flex" data-testid="login-page">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img src={HERO_IMG} alt="Smart farming" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[#1B4332]/80" />
        <div className="relative z-10 flex flex-col justify-end p-12 text-white">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-md bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Leaf size={20} strokeWidth={1.5} />
            </div>
            <span className="text-lg font-bold" style={{ fontFamily: 'Manrope' }}>SmartFarm</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4" style={{ fontFamily: 'Manrope' }}>
            Intelligent Agriculture Platform
          </h1>
          <p className="text-base text-white/80 max-w-md leading-relaxed">
            AI-powered crop recommendations, real-time sensor monitoring, weather insights, and disease detection for modern farming.
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
            <CardTitle className="text-2xl font-bold text-[#1E293B]">Welcome back</CardTitle>
            <CardDescription className="text-sm text-[#475569]">Sign in to your account to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-md bg-[#E07A5F]/10 border border-[#E07A5F]/20 text-sm text-[#E07A5F]" data-testid="login-error">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-[#1E293B]">Email</Label>
                <Input
                  id="email"
                  data-testid="login-email-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-[#E2E8F0] bg-white focus:ring-2 focus:ring-[#1B4332]/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-[#1E293B]">Password</Label>
                <Input
                  id="password"
                  data-testid="login-password-input"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-[#E2E8F0] bg-white focus:ring-2 focus:ring-[#1B4332]/20"
                />
              </div>
              <Button
                type="submit"
                data-testid="login-submit-btn"
                disabled={loading}
                className="w-full bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-md transition-colors duration-200"
              >
                {loading ? 'Signing in...' : 'Sign In'}
                {!loading && <ArrowRight size={16} className="ml-2" />}
              </Button>
              <p className="text-sm text-center text-[#475569]">
                Don't have an account?{' '}
                <Link to="/register" data-testid="goto-register-link" className="text-[#1B4332] font-medium hover:text-[#2D6A4F] transition-colors">
                  Create one
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
