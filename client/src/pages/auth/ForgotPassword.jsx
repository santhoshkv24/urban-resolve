import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, ArrowLeft, Mail, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import apiClient from '../../api/client';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const AuthCard = ({ children }) => (
  <div className="min-h-screen mesh-bg flex flex-col items-center justify-center px-4 py-12">
    <div className="w-full max-w-md">
      {/* Brand */}
      <div className="flex items-center justify-center gap-2.5 mb-8">
        <img src="/logo.png" alt="Urban Resolve" className="h-9 w-auto" />
        <span className="font-display font-bold text-on-surface text-sm tracking-tight">
          Urban<span className="text-secondary">Resolve</span>
        </span>
      </div>
      <div className="glass-card rounded-3xl p-8 shadow-ambient-lg">
        {children}
      </div>
    </div>
  </div>
);

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    try {
      await apiClient.post('/auth/forgot-password', { email });
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.response?.data?.error?.message || 'Failed to send reset instructions. Please try again.');
    }
  };

  return (
    <AuthCard>
      {status === 'success' ? (
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-display font-bold text-on-surface mb-3">Check your inbox</h2>
          <p className="text-on-surface-variant text-sm leading-relaxed mb-2">
            We sent a 6-digit reset code to
          </p>
          <p className="font-bold text-on-surface mb-8">{email}</p>
          
          <Button
            variant="civic"
            className="w-full mb-6"
            onClick={() => navigate('/reset-password', { state: { email } })}
          >
            Enter Reset Code
          </Button>

          <p className="text-xs text-on-surface-variant mb-6">
            Didn't receive it? Check your spam folder or{' '}
            <button
              onClick={() => setStatus('idle')}
              className="text-secondary font-semibold hover:underline"
            >
              try again
            </button>.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>
      ) : (
        <>
          <div className="w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center mb-6">
            <KeyRound className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-2xl font-display font-bold text-on-surface mb-2">Forgot password?</h2>
          <p className="text-on-surface-variant text-[15px] mb-8 leading-relaxed">
            No worries. Enter your email and we'll send you reset instructions.
          </p>

          {status === 'error' && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-error-container/80 border border-error/20 text-on-error-container text-sm font-medium mb-6 animate-fade-up">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-error" />
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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

            <Button
              type="submit"
              variant="civic"
              size="lg"
              className="w-full"
              loading={status === 'loading'}
            >
              {status === 'loading' ? 'Sending...' : 'Send Reset Instructions'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </Link>
          </div>
        </>
      )}
    </AuthCard>
  );
};

export default ForgotPassword;
