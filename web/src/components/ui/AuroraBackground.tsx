'use client';
import { motion } from 'framer-motion';
import React from 'react';

export const AuroraBackground = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#F8F9FA]">
      {/* Aurora Blobs */}
      <div className="absolute inset-0 z-0 opacity-60">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-blue-200 blur-[100px]"
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
            scale: [1, 1.5, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-[20%] right-[-10%] h-[400px] w-[400px] rounded-full bg-purple-200 blur-[100px]"
        />
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 5 }}
          className="absolute bottom-[-10%] left-[20%] h-[600px] w-[600px] rounded-full bg-teal-100 blur-[100px]"
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
