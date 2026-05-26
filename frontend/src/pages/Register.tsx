import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../context/store';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Logo } from '../components/common/Logo';
import { Terminal } from 'lucide-react';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register, error, isLoading } = useAppStore();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; email?: string; password?: string }>({});

  const validate = () => {
    const errs: typeof fieldErrors = {};
    if (!username) {
      errs.username = 'Username is required';
    } else if (username.trim().length < 3) {
      errs.username = 'Must be at least 3 characters';
    }
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const success = await register(username, email, password);
    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-background text-foreground p-4 relative overflow-hidden">
      
      {/* Sleek Floating Background Circles */}
      <div className="floating-circle w-96 h-96 -top-24 -left-24 bg-brand-500/10" />
      <div className="floating-circle w-96 h-96 -bottom-24 -right-24 bg-indigo-500/10" />

      {/* Main Glass Card */}
      <Card hoverEffect={false} className="w-full max-w-md relative z-10 !p-8 bg-card backdrop-blur-2xl border border-border shadow-2xl">
        
        {/* Brand Banner */}
        <div className="flex flex-col items-center mb-8 text-center select-none">
          <Logo size="lg" iconOnly className="mb-3" />
          <h2 className="font-sans font-black text-2xl text-foreground glow-text tracking-tight flex items-center">
            STUDIQ
          </h2>
          <p className="text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wider">
            Establish Student Identity
          </p>
        </div>

        {/* Global server error alert */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-semibold flex items-center gap-2 animate-slide-up">
            <Terminal size={14} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          
          <Input
            id="username-reg"
            label="Display Username"
            placeholder="e.g. SarahConnor"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            error={fieldErrors.username}
            required
            autoComplete="username"
          />

          <Input
            id="email-reg"
            label="University Email"
            type="email"
            placeholder="student@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
            required
            autoComplete="email"
          />

          <Input
            id="password-reg"
            label="Security Password"
            type="password"
            placeholder="•••••••• (Min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
            required
            autoComplete="new-password"
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full font-bold h-11 text-sm mt-3"
            isLoading={isLoading}
          >
            Create Operating Account
          </Button>

        </form>

        {/* Login Footer */}
        <div className="mt-8 text-center text-xs text-muted-foreground font-medium">
          Already established?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 font-bold transition-colors">
            Authenticate Identity
          </Link>
        </div>

      </Card>
    </div>
  );
};
