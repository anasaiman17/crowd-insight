import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Activity, Shield, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(email, password, role);
      if (success) {
        toast({
          title: 'Welcome back!',
          description: 'Successfully logged in to CrowdVision.',
        });
        navigate('/dashboard');
      } else {
        toast({
          title: 'Login failed',
          description: 'Please check your credentials.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred during login.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-card relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 flex flex-col justify-center px-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-16 w-16 rounded-2xl bg-gradient-primary flex items-center justify-center">
              <Activity className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">CrowdVision</h1>
              <p className="text-muted-foreground">AI-Powered Monitoring</p>
            </div>
          </div>
          
          <h2 className="text-4xl font-bold mb-6 leading-tight">
            Intelligent Crowd
            <br />
            <span className="text-gradient">Monitoring System</span>
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-md">
            Real-time people detection, crowd density analysis, and comprehensive 
            analytics powered by advanced computer vision technology.
          </p>

          <div className="mt-12 grid grid-cols-2 gap-6">
            <div className="glass-card p-4">
              <p className="text-3xl font-bold text-primary">99.2%</p>
              <p className="text-sm text-muted-foreground">Detection Accuracy</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-3xl font-bold text-success">50ms</p>
              <p className="text-sm text-muted-foreground">Processing Time</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 lg:hidden">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                <Activity className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold">CrowdVision</h1>
            </div>
          </div>

          <div className="glass-card p-8">
            <h2 className="text-2xl font-bold mb-2">Welcome back</h2>
            <p className="text-muted-foreground mb-8">
              Sign in to access your dashboard
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Role Selection */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('user')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    role === 'user'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <User className={`h-6 w-6 mx-auto mb-2 ${role === 'user' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <p className="text-sm font-medium">User</p>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    role === 'admin'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Shield className={`h-6 w-6 mx-auto mb-2 ${role === 'admin' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <p className="text-sm font-medium">Admin</p>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Password</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                variant="gradient"
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Demo: Enter any email and password (4+ chars) to login
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
