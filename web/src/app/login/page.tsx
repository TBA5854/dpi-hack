'use client';
import { AuroraBackground } from '@/components/ui/AuroraBackground';
import { GlassCard } from '@/components/ui/GlassCard';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    try {
      let res;
      if (isRegistering) {
        res = await api.post('/auth/register', { username, password, phoneNumber: phone });
      } else {
        res = await api.post('/auth/login', { identifier: username, password });
      }

      if (!res) return; // Handled by api helper (redirect)
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Authentication failed');
        return;
      }

      // Success
      localStorage.setItem('token', data.token);
      
      // Check if user has location set
      const locRes = await api.get('/location/my-dpi');
      if (locRes && locRes.status === 404) {
        router.push('/onboarding');
      } else {
        router.push('/dashboard');
      }
      
    } catch (e) {
      setError('Network error');
    }
  };

  return (
    <AuroraBackground>
      <div className="flex items-center justify-center min-h-screen p-4">
        <GlassCard className="w-full max-w-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {isRegistering ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-gray-500">
              {isRegistering ? 'Join the future of addressing' : 'Sign in to access your DPI'}
            </p>
          </div>

          <div className="space-y-4">
            <Input 
              placeholder="Username" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
            />
            
            {isRegistering && (
              <Input 
                placeholder="Phone Number (10 digits)" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
              />
            )}
            
            <Input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />

            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg border border-red-100">
                {error}
              </div>
            )}

            <Button onClick={handleSubmit} className="w-full h-12 text-lg mt-4">
              {isRegistering ? 'Sign Up' : 'Login'}
            </Button>
            
            <div className="text-center mt-4">
              <button 
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-sm text-blue-600 hover:underline font-medium"
              >
                {isRegistering ? 'Already have an account? Login' : 'New here? Create account'}
              </button>
            </div>
          </div>
        </GlassCard>
      </div>
    </AuroraBackground>
  );
}
