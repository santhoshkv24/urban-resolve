import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, CheckCircle2, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';
import apiClient from '../../api/client';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';

const AuthCard = ({ children }) => (
  <div className="min-h-screen mesh-bg flex flex-col items-center justify-center px-4 py-12">
    <div className="w-full max-w-md">
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

const VerifyOTP = () => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [success, setSuccess] = useState(false);
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const otpSent = React.useRef(false);

  React.useEffect(() => {
    if (user && !user.emailVerified && !otpSent.current) {
      handleResend();
      otpSent.current = true;
    }
  }, [user]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      await apiClient.post('/auth/verify-otp', { otp });
      await refreshUser(); // Update user object to emailVerified: true
      setSuccess(true);
      setTimeout(() => navigate('/app'), 2000);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await apiClient.post('/auth/send-otp');
      setError('');
    } catch (err) {
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthCard>
      {success ? (
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-display font-bold text-on-surface mb-3">Verified!</h2>
          <p className="text-on-surface-variant text-sm mb-2">Your account has been verified.</p>
          <p className="text-xs text-on-surface-variant/60">Redirecting to your dashboard...</p>
        </div>
      ) : (
        <>
          <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mb-6">
            <ShieldCheck className="w-7 h-7 text-secondary" />
          </div>
          <h2 className="text-2xl font-display font-bold text-on-surface mb-2">Verify your email</h2>
          <p className="text-on-surface-variant text-[15px] mb-8 leading-relaxed">
            We've sent a 6-digit code to your inbox. Enter it below to confirm your account.
          </p>

          {error && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-error-container/80 border border-error/20 text-on-error-container text-sm font-medium mb-6 animate-fade-up">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-error" />
              {error}
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="otp" className="text-sm font-semibold text-on-surface-variant text-center">
                Enter 6-digit code
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full px-4 py-4 rounded-xl bg-surface border border-outline-variant/60 text-on-surface text-center text-3xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all duration-200"
                required
              />
              <p className="text-center text-xs text-on-surface-variant/60 mt-1">
                {otp.length}/6 digits entered
              </p>
            </div>

            <Button
              type="submit"
              variant="civic"
              size="lg"
              className="w-full"
              loading={loading}
              disabled={otp.length !== 6}
            >
              {loading ? 'Verifying...' : 'Verify Account'}
            </Button>
          </form>

          <div className="mt-6 flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-secondary hover:text-secondary-hover transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
              {resending ? 'Resending...' : "Didn't receive it? Resend OTP"}
            </button>

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

export default VerifyOTP;
