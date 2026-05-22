import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { CheckCircle2, ChevronLeft } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    
    // Simulate sending recovery token
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1200);
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-background text-foreground p-4 relative overflow-hidden">
      
      {/* Sleek Floating Background Circles */}
      <div className="floating-circle w-96 h-96 -top-24 -left-24 bg-brand-500/10" />
      <div className="floating-circle w-96 h-96 -bottom-24 -right-24 bg-indigo-500/10" />

      {/* Main Glass Card */}
      <Card hoverEffect={false} className="w-full max-w-md relative z-10 !p-8 bg-card backdrop-blur-2xl border border-border shadow-2xl">
        
        {!isSubmitted ? (
          <>
            {/* Header */}
            <div className="flex flex-col items-center mb-8 text-center">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-brand-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-brand-500/25 mb-3">
                S
              </div>
              <h2 className="font-sans font-black text-xl text-foreground glow-text tracking-tight">
                Reset Security Key
              </h2>
              <p className="text-xs text-muted-foreground mt-2 max-w-xs">
                Provide your university email below, and we will transmit security recovery parameters to regain entry access.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="recovery-email"
                label="Registered Email"
                type="email"
                placeholder="student@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full font-bold h-11 text-sm mt-3"
                isLoading={isLoading}
              >
                Transmit Reset Parameters
              </Button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center text-center py-4">
            <div className="h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 shadow-sm">
              <CheckCircle2 size={28} className="animate-float" />
            </div>
            
            <h2 className="font-sans font-black text-xl text-foreground mb-2">
              Transmission Complete!
            </h2>
            
            <p className="text-sm text-muted-foreground leading-relaxed mb-8 max-w-xs">
              Check your university inbox at <strong className="text-brand-400">{email}</strong>. We've dispatched password override credentials!
            </p>

            <Button onClick={() => setIsSubmitted(false)} variant="secondary" className="w-full h-10 text-xs">
              Resend Code
            </Button>
          </div>
        )}

        {/* Back Link */}
        <div className="mt-8 text-center text-xs">
          <Link to="/login" className="inline-flex items-center gap-1 text-muted-foreground hover:text-brand-400 font-semibold transition-colors">
            <ChevronLeft size={14} /> Back to Identity Portal
          </Link>
        </div>

      </Card>
    </div>
  );
};
