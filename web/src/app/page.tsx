'use client';
import { AuroraBackground } from '@/components/ui/AuroraBackground';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <AuroraBackground>
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <GlassCard className="max-w-2xl w-full flex flex-col items-center py-16 px-8">
          <div className="h-20 w-20 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-4xl mb-8 shadow-xl shadow-blue-500/20">
            A
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
            The Future of <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">Addressing</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-10 max-w-lg leading-relaxed">
            Experience the Digital Postal Index. A precise, universal, and beautiful way to locate anything, anywhere.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <Link href="/dashboard" className="flex-1">
                <Button className="w-full h-14 text-lg rounded-2xl">
                Get Started <ArrowRight className="ml-2" />
                </Button>
            </Link>
            <Button variant="secondary" className="flex-1 h-14 text-lg rounded-2xl">
              Learn More
            </Button>
          </div>
        </GlassCard>
        
        <div className="mt-8 text-gray-400 text-sm">
            Powered by Arch DPI Protocol
        </div>
      </div>
    </AuroraBackground>
  );
}
