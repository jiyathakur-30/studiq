import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../context/store';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Logo } from '../components/common/Logo';
import { Sparkles, Terminal } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, error, isLoading } = useAppStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const errs: typeof fieldErrors = {};
    if (!email) {
      errs.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errs.email = 'Invalid email syntax';
    }
    if (!password) {
      errs.password = 'Password is required';
    } else if (password.length < 6) {
      errs.password = 'Must be at least 6 characters';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    const success = await login(email, password);
    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-background text-foreground p-4 relative overflow-hidden">
      
      {/* Sleek Floating Neon Circles */}
      <div className="floating-circle w-96 h-96 -top-24 -left-24 bg-brand-500/10" />
      <div className="floating-circle w-96 h-96 -bottom-24 -right-24 bg-indigo-500/10" />

      {/* Main Glass Center Card */}
      <Card hoverEffect={false} className="w-full max-w-md relative z-10 !p-8 bg-card backdrop-blur-2xl border border-border shadow-2xl">
        
        {/* Brand Banner */}
        <div className="flex flex-col items-center mb-8 text-center select-none">
          <Logo size="lg" iconOnly className="mb-3" />
          <h2 className="font-sans font-black text-2xl text-foreground glow-text tracking-tight flex items-center">
            STUDIQ
          </h2>
          <p className="text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wider">
            Student Productivity Platform
          </p>
        </div>

        {/* Global server error alert */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-semibold flex items-center gap-2 animate-slide-up">
            <Terminal size={14} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          
          <Input
            id="email-input"
            label="University Email"
            type="email"
            placeholder="demo@studiq.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
            required
            autoComplete="email"
          />

          <div className="space-y-1">
            <Input
              id="password-input"
              label="Secret Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={fieldErrors.password}
              required
              autoComplete="current-password"
            />
            <div className="flex justify-end pr-1">
              <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-brand-400 font-semibold transition-colors">
                Forgot password?
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full font-bold h-11 text-sm mt-2"
            isLoading={isLoading}
          >
            Authenticate Portal
          </Button>

        </form>

        {/* Demo Credentials Sandbox Note */}
        <div className="mt-6 p-3.5 bg-muted border border-border rounded-lg text-[11px] text-muted-foreground text-left space-y-1">
          <span className="font-bold text-foreground block mb-0.5">🌟 Developer Demo Notice:</span>
          <span>• Email: <strong className="text-brand-400">demo@studiq.com</strong></span>
          <span>• Password: <strong className="text-brand-400">password123</strong></span>
          <span className="block mt-1 italic text-muted-foreground/60">Includes active database fail-safe bypass (IndexedDB offline mode).</span>
        </div>

        {/* Register Footer */}
        <div className="mt-8 text-center text-xs text-muted-foreground font-medium">
          New to STUDIQ?{' '}
          <Link to="/register" className="text-brand-400 hover:text-brand-300 font-bold transition-colors">
            Establish Student Identity
          </Link>
        </div>

      </Card>
    </div>
  );
};
