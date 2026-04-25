import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock, ArrowLeft, CheckCircle2, AlertCircle, Sparkles, ShieldCheck, Mail, Hash } from 'lucide-react';
import apiClient from '../../api/client';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const AuthCard = ({ children }) => (
  <div className="min-h-screen mesh-bg flex flex-col items-center justify-center px-4 py-12">
    <div className="w-full max-w-md">
      <div className="flex items-center justify-center gap-2.5 mb-8">
        <div className="w-9 h-9 rounded-xl bg-gradient-civic flex items-center justify-center shadow-sm">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <span className="font-display font-bold text-on-surface text-sm tracking-tight">
          Municipal<span className="text-secondary">Desk</span>
        </span>
      </div>
      <div className="glass-card rounded-3xl p-8 shadow-ambient-lg">
        {children}
      </div>
    </div>
  </div>
);

const ResetPassword = () => {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please check and try again.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (otp.length !== 6) {
      setErrorMsg('Please enter the 6-digit reset code.');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      await apiClient.post('/auth/reset-password', { 
        email, 
        otp, 
        newPassword: password 
      });
      setStatus('success');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.response?.data?.error?.message || 'Failed to reset password. The code may be incorrect or expired.');
    }
  };

  return (
    <AuthCard>
      {status === 'success' ? (
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-display font-bold text-on-surface mb-3">Password Reset!</h2>
          <p className="text-on-surface-variant text-sm mb-1">Your password has been updated successfully.</p>
          <p className="text-xs text-on-surface-variant/60 mb-6">Redirecting to sign in...</p>
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-secondary hover:underline"
          >
            Go to sign in now
          </Link>
        </div>
      ) : (
        <>
          <div className="w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center mb-6">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-2xl font-display font-bold text-on-surface mb-2">Reset password</h2>
          <p className="text-on-surface-variant text-[15px] mb-8 leading-relaxed">
            Enter the reset code sent to your email and your new password.
          </p>

          {errorMsg && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-error-container/80 border border-error/20 text-on-error-container text-sm font-medium mb-6 animate-fade-up">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-error" />
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              leftIcon={Mail}
              required
              disabled={!!location.state?.email}
            />
            
            <Input
              label="Reset Code (6 digits)"
              type="text"
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              leftIcon={Hash}
              required
              maxLength={6}
            />

            <Input
              label="New Password"
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              leftIcon={Lock}
              required
              minLength={6}
            />
            <Input
              label="Confirm New Password"
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              leftIcon={Lock}
              required
              error={
                confirmPassword && password !== confirmPassword
                  ? 'Passwords do not match'
                  : undefined
              }
            />

            <Button
              type="submit"
              variant="civic"
              size="lg"
              className="w-full mt-2"
              loading={status === 'loading'}
              disabled={!email || otp.length !== 6 || !password || !confirmPassword}
            >
              {status === 'loading' ? 'Resetting...' : 'Reset Password'}
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

export default ResetPassword;
