'use client';
import { AuroraBackground } from '@/components/ui/AuroraBackground';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { MapPin, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function Onboarding() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSetLocation = () => {
    setLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        
        const res = await api.post('/location/initial', { latitude, longitude });
        
        if (res && res.ok) {
          router.push('/dashboard');
        } else {
          setError('Failed to save location. Try again.');
        }
      } catch (e) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    }, (err) => {
      setError('Location permission denied. Please enable it.');
      setLoading(false);
    });
  };

  return (
    <AuroraBackground>
      <div className="flex items-center justify-center min-h-screen p-4">
        <GlassCard className="w-full max-w-lg p-10 text-center">
          <div className="h-24 w-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
            <MapPin size={40} />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Let's Find You
          </h1>
          
          <p className="text-gray-600 text-lg mb-8">
            To generate your unique Digital Postal Index (DPI), we need your current location. This will be your primary digital address.
          </p>

          {error && (
            <div className="mb-6 text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">
              {error}
            </div>
          )}

          <Button 
            onClick={handleSetLocation} 
            disabled={loading}
            className="w-full h-14 text-lg rounded-xl"
          >
            {loading ? (
              <><Loader2 className="animate-spin mr-2" /> Locating...</>
            ) : (
              'Use My Current Location'
            )}
          </Button>
          
          <p className="mt-6 text-sm text-gray-400">
            You can refine this later in your dashboard.
          </p>
        </GlassCard>
      </div>
    </AuroraBackground>
  );
}
