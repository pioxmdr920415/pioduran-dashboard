import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import Header from './Header';

const modules = [
  {
    id: 'supply',
    name: 'Supply Inventory',
    icon: '📦',
    color: '#0ea5e9',
    gradient: 'from-sky-400 to-cyan-500',
    description: 'Manage supplies and inventory',
    features: ['Track items', 'Stock levels', 'Categories']
  },
  {
    id: 'contact',
    name: 'Contact Directory',
    icon: '👥',
    color: '#22c55e',
    gradient: 'from-green-400 to-emerald-500',
    description: 'Browse contact information',
    features: ['Staff directory', 'Departments', 'Quick search']
  },
  {
    id: 'schedule',
    name: 'Calendar Management',
    icon: '📅',
    color: '#8b5cf6',
    gradient: 'from-violet-400 to-purple-500',
    description: 'View events and schedules',
    features: ['Event calendar', 'Schedules', 'Planning']
  },
  {
    id: 'documents',
    name: 'Document Management',
    icon: '📄',
    color: '#f59e0b',
    gradient: 'from-amber-400 to-orange-500',
    description: 'Access documents',
    features: ['File access', 'Offline support', 'Organization']
  },
  {
    id: 'photos',
    name: 'Photo Documentation',
    icon: '📸',
    color: '#ec4899',
    gradient: 'from-pink-400 to-rose-500',
    description: 'Browse photo gallery',
    features: ['Photo gallery', 'Media files', 'Documentation']
  },
  {
    id: 'maps',
    name: 'Maps',
    icon: '🗺️',
    color: '#14b8a6',
    gradient: 'from-teal-400 to-cyan-500',
    description: 'View maps and locations',
    features: ['Map viewer', 'Locations', 'Offline maps']
  },
];

// Memoized Module Card Component
const ModuleCard = memo(({ module, isDarkMode, onClick }) => (
  <div
    className={`group relative overflow-hidden rounded-2xl backdrop-blur-xl border transition-all duration-500 cursor-pointer transform hover:scale-[1.02] hover:-translate-y-1 ${
      isDarkMode
        ? 'bg-gray-800/50 border-gray-700/50 hover:bg-gray-800/70 hover:border-gray-600 shadow-xl hover:shadow-2xl'
        : 'bg-white/80 border-white/50 hover:bg-white shadow-lg hover:shadow-2xl'
    }`}
    data-testid={`module-card-${module.id}`}
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        onClick();
      }
    }}
  >
    {/* Animated Background Gradient */}
    <div 
      className={`absolute inset-0 bg-gradient-to-br ${module.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
    />
    
    {/* Decorative Circle */}
    <div
      className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${module.gradient} rounded-full opacity-10 group-hover:opacity-20 transition-all duration-500 group-hover:scale-150`}
    />

    {/* Content */}
    <div className="relative z-10 p-8">
      {/* Icon and Title */}
      <div className="flex items-center gap-4 mb-4">
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-lg bg-gradient-to-br ${module.gradient}`}
        >
          {module.icon}
        </div>
        <h2 className={`text-xl font-bold transition-colors ${
          isDarkMode ? 'text-white group-hover:text-gray-100' : 'text-gray-900 group-hover:text-gray-800'
        }`}>
          {module.name}
        </h2>
      </div>

      {/* Description */}
      <p className={`text-sm mb-4 transition-colors ${
        isDarkMode ? 'text-gray-400' : 'text-gray-600'
      }`}>
        {module.description}
      </p>

      {/* Features */}
      <div className="mb-6 space-y-2">
        {module.features.map((feature, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${module.gradient}`} />
            <span className={`text-xs transition-colors ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {feature}
            </span>
          </div>
        ))}
      </div>

      {/* Button */}
      <button
        className={`w-full font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl bg-gradient-to-r ${module.gradient} text-white transform group-hover:translate-x-1`}
        data-testid={`module-button-${module.id}`}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        OPEN MODULE
        <svg 
          className="w-5 h-5 transform transition-transform group-hover:translate-x-1" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </button>
    </div>

    {/* Hover Glow Effect */}
    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${module.gradient} blur-2xl -z-10`} />
  </div>
));

ModuleCard.displayName = 'ModuleCard';

// Memoized Stat Card Component
const StatCard = memo(({ title, value, icon, gradient, isDarkMode }) => (
  <div className={`p-6 rounded-xl backdrop-blur-xl border transition-all duration-300 ${
    isDarkMode
      ? `bg-gradient-to-br ${gradient.dark} ${gradient.border.dark}`
      : `bg-gradient-to-br ${gradient.light} ${gradient.border.light}`
  }`}>
    <div className="flex items-center justify-between">
      <div>
        <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {title}
        </p>
        <p className={`text-3xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {value}
        </p>
      </div>
      <div className={`w-12 h-12 bg-gradient-to-br ${gradient.icon} rounded-xl flex items-center justify-center text-2xl`}>
        {icon}
      </div>
    </div>
  </div>
));

StatCard.displayName = 'StatCard';

const Dashboard = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  const handleModuleClick = (moduleId) => {
    navigate(`/${moduleId}`);
  };

  const stats = [
    {
      title: 'Total Modules',
      value: modules.length,
      icon: '🎯',
      gradient: {
        dark: 'from-blue-900/30 to-indigo-900/30',
        light: 'from-blue-50 to-indigo-50',
        border: { dark: 'border-blue-700/50', light: 'border-blue-200/50' },
        icon: 'from-blue-400 to-indigo-500'
      }
    },
    {
      title: 'System Status',
      value: 'Operational',
      icon: '✓',
      gradient: {
        dark: 'from-green-900/30 to-emerald-900/30',
        light: 'from-green-50 to-emerald-50',
        border: { dark: 'border-green-700/50', light: 'border-green-200/50' },
        icon: 'from-green-400 to-emerald-500'
      }
    },
    {
      title: 'Offline Support',
      value: 'Enabled',
      icon: '💾',
      gradient: {
        dark: 'from-purple-900/30 to-pink-900/30',
        light: 'from-purple-50 to-pink-50',
        border: { dark: 'border-purple-700/50', light: 'border-purple-200/50' },
        icon: 'from-purple-400 to-pink-500'
      }
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 z-0">
        {/* Base gradient */}
        <div className={`absolute inset-0 transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
            : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'
        }`} />
        
        {/* Dot Pattern */}
        <div 
          className={`absolute inset-0 opacity-30 ${
            isDarkMode ? 'opacity-20' : 'opacity-30'
          }`}
          style={{
            backgroundImage: `radial-gradient(circle, ${
              isDarkMode ? 'rgba(139, 92, 246, 0.4)' : 'rgba(99, 102, 241, 0.3)'
            } 1px, transparent 1px)`,
            backgroundSize: '30px 30px'
          }}
        />
        
        {/* Animated gradient orbs */}
        <div className={`absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-20 animate-pulse ${
          isDarkMode 
            ? 'bg-gradient-to-br from-indigo-600 to-purple-600' 
            : 'bg-gradient-to-br from-indigo-300 to-purple-300'
        }`} style={{ animationDuration: '4s' }} />
        
        <div className={`absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-20 animate-pulse ${
          isDarkMode 
            ? 'bg-gradient-to-br from-pink-600 to-purple-600' 
            : 'bg-gradient-to-br from-pink-300 to-purple-300'
        }`} style={{ animationDuration: '6s', animationDelay: '1s' }} />
        
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl opacity-10 animate-pulse ${
          isDarkMode 
            ? 'bg-gradient-to-br from-cyan-600 to-blue-600' 
            : 'bg-gradient-to-br from-cyan-300 to-blue-300'
        }`} style={{ animationDuration: '8s', animationDelay: '2s' }} />
        
        {/* Geometric lines pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path 
                d="M 40 0 L 0 0 0 40" 
                fill="none" 
                stroke={isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'} 
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
       

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="dashboard-modules">
          {modules.map((module) => (
            <ModuleCard
              key={module.id}
              module={module}
              isDarkMode={isDarkMode}
              onClick={() => handleModuleClick(module.id)}
            />
          ))}
        </div>

        {/* Quick Stats Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat) => (
            <StatCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              gradient={stat.gradient}
              isDarkMode={isDarkMode}
            />
          ))}
        </div>
      </div>
      </div>
    </div>
  );
};

export default memo(Dashboard);
