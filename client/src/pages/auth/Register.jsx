import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User, Mail, Lock, Phone, MapPin, ArrowRight, Sparkles, AlertCircle, Building2
} from 'lucide-react';
import apiClient from '../../api/client';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const GridPattern = () => (
  <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="grid-register" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
        <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="0.5" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#grid-register)" className="text-on-surface" />
  </svg>
);

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await apiClient.post('/auth/register', formData);
      if (response.data.success) {
        navigate('/login', { state: { message: 'Account created! Please sign in.' } });
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* ── Left Side: Hero Panel ─────────────────────────────────── */}
      <div className="hidden lg:flex w-[42%] relative overflow-hidden">
        <div className="absolute inset-0 auth-dark-panel" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-emerald-900/40 rounded-full blur-[80px] mix-blend-screen animate-pulse-soft" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-secondary/20 rounded-full blur-[60px] mix-blend-screen animate-float" />
        <svg className="absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hero-grid-reg" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid-reg)" />
        </svg>
        <div className="relative z-10 flex flex-col justify-end p-12">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-8">
            <Building2 className="w-6 h-6 text-white/80" />
          </div>
          <h2 className="text-4xl font-display font-bold text-white leading-tight tracking-tight mb-4">
            Join the movement for smarter{' '}
            <span className="text-emerald-400">governance.</span>
          </h2>
          <p className="text-slate-300 text-base leading-relaxed max-w-sm mb-8">
            Create your account to report issues, track resolutions, and collaborate directly with city officials.
          </p>
          <div className="flex gap-6">
            {[{ value: 'Free', label: 'Always free' }, { value: '2min', label: 'Quick setup' }, { value: 'Secure', label: 'Data protected' }].map(({ value, label }) => (
              <div key={label}>
                <p className="text-lg font-display font-bold text-white">{value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Side: Form ─────────────────────────────────────────── */}
      <div className="w-full lg:w-[58%] flex flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-24 relative">
        <GridPattern />
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/4 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-md w-full mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-8">
            <img src="/logo.png" alt="Urban Resolve" className="h-10 w-auto" />
            <span className="font-display font-bold text-on-surface text-base tracking-tight">
              Urban<span className="text-secondary">Resolve</span>
            </span>
          </div>

          <div className="mb-7">
            <h1 className="text-3xl font-display font-bold text-on-surface tracking-tight mb-2">
              Create your account
            </h1>
            <p className="text-on-surface-variant text-[15px]">
              Join thousands of citizens making their neighborhoods better.
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-3 p-3.5 rounded-xl bg-error-container/80 border border-error/20 text-on-error-container text-sm font-medium animate-fade-up">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-error" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              id="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Sarah Jenkins"
              leftIcon={User}
              required
              autoComplete="name"
            />

            <Input
              label="Email Address"
              type="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="sarah@example.com"
              leftIcon={Mail}
              required
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              leftIcon={Lock}
              required
              minLength={6}
              hint="Minimum 6 characters"
              autoComplete="new-password"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Phone (Optional)"
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 234 567 890"
                leftIcon={Phone}
                autoComplete="tel"
              />
              <Input
                label="Address (Optional)"
                type="text"
                id="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Neighborhood, City"
                leftIcon={MapPin}
                autoComplete="street-address"
              />
            </div>

            <Button
              type="submit"
              variant="civic"
              size="lg"
              className="w-full mt-2"
              loading={loading}
              rightIcon={!loading ? ArrowRight : undefined}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-on-surface-variant">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-bold hover:text-secondary transition-colors hover:underline">
              Sign in instead
            </Link>
          </p>

          <p className="mt-4 text-center text-xs text-on-surface-variant/50">
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
