import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

/* Animated grid background SVG */
const GridPattern = () => (
  <svg
    className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <pattern id="grid-login" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
        <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="0.5" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#grid-login)" className="text-on-surface" />
  </svg>
);

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await apiClient.post('/auth/login', { email, password });
      if (response.data.success) {
        const { user, token } = response.data.data;
        login(user, token);
        
        // Redirect to verification if citizen and not verified
        if (!user.emailVerified && user.role === 'CITIZEN') {
          navigate('/verify-otp');
        } else {
          navigate('/app');
        }
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* ── Left Side: Form ─────────────────────────────────────────── */}
      <div className="w-full lg:w-[52%] flex flex-col justify-center px-8 sm:px-12 lg:px-20 xl:px-28 relative">
        {/* Subtle grid overlay */}
        <GridPattern />

        {/* Aurora blob */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/3 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-sm w-full mx-auto">
          {/* Logo mark */}
          <div className="flex items-center gap-2.5 mb-10">
            <img src="/logo.png" alt="Urban Resolve" className="h-10 w-auto" />
            <span className="font-display font-bold text-on-surface text-base tracking-tight">
              Urban<span className="text-secondary">Resolve</span>
            </span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-on-surface tracking-tight mb-2">
              Welcome back
            </h1>
            <p className="text-on-surface-variant text-[15px] leading-relaxed">
              Sign in to track reports, manage civic issues, and build a better city.
            </p>
          </div>

          {/* Error alert */}
          {error && (
            <div className="mb-6 flex items-start gap-3 p-3.5 rounded-xl bg-error-container/80 border border-error/20 text-on-error-container text-sm font-medium animate-fade-up">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-error" />
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              leftIcon={Mail}
              required
              autoComplete="email"
            />

            <div>
              <Input
                label="Password"
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                leftIcon={Lock}
                required
                autoComplete="current-password"
              />
              <div className="flex justify-end mt-2">
                <Link
                  to="/forgot-password"
                  className="text-xs text-secondary hover:text-secondary-hover font-semibold hover:underline transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              variant="civic"
              size="lg"
              className="w-full mt-2"
              loading={loading}
              rightIcon={!loading ? ArrowRight : undefined}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-outline-variant/40" />
            <span className="text-xs text-on-surface-variant/50 font-medium">or</span>
            <div className="flex-1 h-px bg-outline-variant/40" />
          </div>

          <p className="text-center text-sm text-on-surface-variant">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-bold hover:text-secondary transition-colors hover:underline">
              Create one free
            </Link>
          </p>
        </div>
      </div>

      {/* ── Right Side: Hero Panel ─────────────────────────────────── */}
      <div className="hidden lg:flex w-[48%] relative overflow-hidden">
        {/* Dark gradient background */}
        <div className="absolute inset-0 auth-dark-panel" />

        {/* Animated blob lights */}
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-secondary/25 rounded-full blur-[80px] mix-blend-screen animate-pulse-soft" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-primary/40 rounded-full blur-[60px] mix-blend-screen animate-float" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-900/30 rounded-full blur-[100px]" />

        {/* Grid pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hero-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid)" />
        </svg>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-end p-12 xl:p-16">
          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mb-10">
            {['Real-time tracking', 'AI routing', 'SLA monitoring', 'Civic intelligence'].map(tag => (
              <span
                key={tag}
                className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 border border-white/15 text-white/70 text-xs font-medium backdrop-blur-sm"
              >
                {tag}
              </span>
            ))}
          </div>

          <h2 className="text-4xl xl:text-5xl font-display font-bold text-white leading-tight tracking-tight mb-5">
            A responsive city<br />
            starts with its{' '}
            <span className="text-secondary">citizens.</span>
          </h2>

          <p className="text-slate-300 text-lg leading-relaxed max-w-md mb-10">
            Track your reports, receive real-time resolution updates, and see the direct impact you're making on your neighborhood.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
