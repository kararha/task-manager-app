"use client";

import React, { useState, useEffect, useRef } from 'react';

// 1. Interactive Particle Background
export const ParticleBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animationFrameId: number;
    let particles: Particle[] = [];
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', resize);
    resize();

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;

      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.size = Math.random() * 2;
        this.color = `rgba(${100 + Math.random() * 100}, ${150 + Math.random() * 100}, 255, ${Math.random() * 0.4})`;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (canvas) {
          if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
          if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
        }
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Create particles
    for (let i = 0; i < 40; i++) {
      particles.push(new Particle());
    }

    const animate = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw all particles
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }

      // Check distances and connect particles
      // Using a triangular loop (j > i) reduces checks from 1600 (N^2) to 780 ((N*(N-1))/2)
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distSq = dx * dx + dy * dy;
          
          // Check squared distance (120^2 = 14400) to avoid slow Math.sqrt calculation
          if (distSq < 14400) {
            const distance = Math.sqrt(distSq);
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.08 * (1 - distance / 120)})`;
            ctx.lineWidth = 0.75;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 opacity-60 dark:opacity-40" />;
};

// 2. Mouse Follower Glow
export const MouseFollower = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setVisible(true);
    };
    
    const handleMouseLeave = () => setVisible(false);

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  if (!visible) return null;

  return (
    <div 
      className="fixed pointer-events-none z-0 mix-blend-screen transition-transform duration-100 ease-out hidden md:block"
      style={{
        left: 0,
        top: 0,
        transform: `translate(${position.x - 150}px, ${position.y - 150}px)`,
      }}
    >
      <div className="w-[300px] h-[300px] rounded-full bg-blue-500/10 dark:bg-blue-500/10 blur-[90px]" />
    </div>
  );
};

// 3. 3D Tilt Card
export const TiltCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('');

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    
    const x = yPct * 12;
    const y = -xPct * 12;
    
    setTransform(`perspective(1000px) rotateX(${x}deg) rotateY(${y}deg) scale3d(1.02, 1.02, 1.02)`);
  };

  const handleMouseLeave = () => {
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
  };

  return (
    <div 
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`transition-transform duration-300 ease-out ${className}`}
      style={{ transform, transformStyle: 'preserve-3d' }}
    >
      {children}
    </div>
  );
};

// 4. Component for the infinitely glowing border
export const GlowingCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`relative p-[1px] rounded-[32px] overflow-hidden ${className}`}>
    {/* Inner glow layers */}
    <div className="absolute -inset-10 rounded-[32px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-40 blur-xl animate-[glow-border_6s_linear_infinite]" />
    <div className="absolute -inset-1 rounded-[32px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-30 blur-sm animate-[glow-border_6s_linear_infinite]" />

    <div className="relative z-10 bg-white/70 dark:bg-slate-900/90 rounded-[31px] h-full backdrop-blur-xl">
      {children}
    </div>
  </div>
);
