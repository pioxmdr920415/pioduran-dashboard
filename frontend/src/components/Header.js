import React, { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

import NotificationCenter from './NotificationCenter';
import StatusIndicator from './StatusIndicator';

const Header = () => {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const canvasRef = useRef(null);

  // Animated background effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let time = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      time += 0.005;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Create flowing gradient waves
      const gradient1 = ctx.createLinearGradient(
        0, 0, 
        canvas.width + Math.sin(time) * 200, 
        canvas.height
      );
      
      if (isDarkMode) {
        gradient1.addColorStop(0, 'rgba(79, 70, 229, 0.15)');
        gradient1.addColorStop(0.5, 'rgba(139, 92, 246, 0.1)');
        gradient1.addColorStop(1, 'rgba(236, 72, 153, 0.15)');
      } else {
        gradient1.addColorStop(0, 'rgba(99, 102, 241, 0.12)');
        gradient1.addColorStop(0.5, 'rgba(168, 85, 247, 0.08)');
        gradient1.addColorStop(1, 'rgba(236, 72, 153, 0.12)');
      }

      ctx.fillStyle = gradient1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw floating circles
      for (let i = 0; i < 3; i++) {
        const x = canvas.width * 0.3 + Math.sin(time + i * 2) * 100;
        const y = canvas.height * 0.5 + Math.cos(time + i * 1.5) * 30;
        const radius = 60 + Math.sin(time + i) * 20;

        const circleGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        
        if (isDarkMode) {
          circleGradient.addColorStop(0, 'rgba(139, 92, 246, 0.3)');
          circleGradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
        } else {
          circleGradient.addColorStop(0, 'rgba(168, 85, 247, 0.2)');
          circleGradient.addColorStop(1, 'rgba(168, 85, 247, 0)');
        }

        ctx.fillStyle = circleGradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDarkMode]);

  return (
    <div className="sticky top-0 z-50 transition-all duration-300 overflow-hidden" data-testid="app-header">
      {/* Animated Canvas Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ filter: 'blur(40px)' }}
      />

      {/* Flowing gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20 animate-gradient-x" />
      
      {/* Main header content with glassmorphism */}
      <div className={`relative backdrop-blur-2xl shadow-2xl border-b transition-all duration-500 ${
        isDarkMode 
          ? 'bg-gray-900/80 border-gray-700/30' 
          : 'bg-white/80 border-white/30'
      }`}>
        {/* Animated top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 animate-gradient-x" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-5">
            {/* Top Row: Logo, Title, Actions */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-5">
                {/* Ultra-Modern Logo */}
                <div className="relative group">
                  {/* Glow effect */}
                  <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-3xl blur-xl opacity-40 group-hover:opacity-70 transition-all duration-500 animate-pulse" />
                  
                  {/* Logo container */}
                  <button
                    className="relative w-16 h-16 bg-gradient-to-br from-cyan-500 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center overflow-hidden hover:scale-110 transition-all duration-500 shadow-2xl hover:shadow-purple-500/50 transform hover:rotate-12 group"
                    data-testid="header-logo"
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    <img
                      src="https://res.cloudinary.com/dedcmctqk/image/upload/v1758626524/logome_qttbxo.webp"
                      alt="Logo"
                      className="w-full h-full object-contain p-1.5 relative z-10 drop-shadow-2xl"
                    />
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  </button>
                </div>
                
                {/* Title with modern styling */}
                <div className="relative">
                  <h1 className="text-2xl font-black tracking-tight">
                    <span className={`bg-gradient-to-r bg-clip-text text-transparent animate-gradient-x ${
                      isDarkMode 
                        ? 'from-cyan-400 via-purple-400 to-pink-400' 
                        : 'from-cyan-600 via-purple-600 to-pink-600'
                    }`}>
                      MDRRMO Pio Duran
                    </span>
                  </h1>
                  <div className="flex items-center gap-2 mt-1.5">
                    {/* Animated status dot */}
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                    </span>
                    <p className={`text-xs font-semibold tracking-wide transition-colors ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      File Inventory & Management System
                    </p>
                  </div>
                </div>
              </div>

              {/* Modern Action Buttons */}
              <div className="flex items-center gap-3">

                
                {/* Ultra-Modern Dark Mode Toggle */}
                <button
                  onClick={toggleDarkMode}
                  className={`relative p-3.5 rounded-2xl transition-all duration-500 hover:scale-110 shadow-xl hover:shadow-2xl group overflow-hidden ${
                    isDarkMode
                      ? 'bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 text-yellow-300'
                      : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-800'
                  }`}
                  data-testid="dark-mode-toggle"
                  title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                  {/* Animated background */}
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                    isDarkMode 
                      ? 'bg-gradient-to-r from-yellow-600/30 to-orange-600/30' 
                      : 'bg-gradient-to-r from-indigo-200/50 to-purple-200/50'
                  }`} />
                  
                  {/* Icon */}
                  {isDarkMode ? (
                    <svg className="w-5 h-5 relative z-10 transform group-hover:rotate-180 transition-transform duration-700 drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 relative z-10 transform group-hover:scale-110 transition-transform duration-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                  )}
                  
                  {/* Ripple effect */}
                  <span className="absolute inset-0 rounded-2xl bg-white/20 scale-0 group-hover:scale-100 transition-transform duration-500" />
                </button>

                {/* Notification Center */}
                
              </div>
            </div>

            {/* Bottom Row: Breadcrumbs with modern styling */}
            <div className="relative flex items-center gap-4">
              {/* Decorative line */}
              <NotificationCenter />
                <StatusIndicator />
            </div>
          </div>
        </div>

        {/* Bottom animated gradient line */}
        <div className="h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
      </div>
    </div>
  );
};

export default Header;