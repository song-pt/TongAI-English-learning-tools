
import React from 'react';
import { AppTheme } from '../types';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  fullWidth?: boolean;
  theme?: AppTheme;
  aeroOpacity?: number;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  theme = 'duolingo',
  aeroOpacity = 70,
  ...props 
}) => {
  const isAero = theme === 'aero';
  
  const baseStyles = isAero 
    ? "px-6 py-2.5 rounded-lg font-semibold transition-all active:scale-95 border relative overflow-hidden flex items-center justify-center gap-2 shadow-sm"
    : "px-6 py-3 rounded-2xl font-bold transition-all active:translate-y-1 active:border-b-0 uppercase tracking-wide flex items-center justify-center gap-2";

  // Use inline style for Aero opacity to allow granular control
  const opacityValue = aeroOpacity / 100;
  
  const aeroStyles = {
    primary: { backgroundColor: `rgba(59, 130, 246, ${opacityValue})` },
    secondary: { backgroundColor: `rgba(6, 182, 212, ${opacityValue})` },
    danger: { backgroundColor: `rgba(239, 68, 68, ${opacityValue})` },
    ghost: { backgroundColor: `rgba(255, 255, 255, ${opacityValue})` },
  };

  const variants = {
    duolingo: {
      primary: "bg-[#58cc02] text-white border-b-4 border-[#46a302] hover:bg-[#61e002]",
      secondary: "bg-[#1cb0f6] text-white border-b-4 border-[#1899d6] hover:bg-[#20c4ff]",
      danger: "bg-[#ff4b4b] text-white border-b-4 border-[#e54343] hover:bg-[#ff5a5a]",
      ghost: "bg-white text-gray-400 border-2 border-gray-200 hover:bg-gray-50",
    },
    aero: {
      primary: "backdrop-blur-md text-black border-white/40 hover:brightness-110 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]",
      secondary: "backdrop-blur-md text-black border-white/40 hover:brightness-110 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]",
      danger: "backdrop-blur-md text-black border-white/40 hover:brightness-110 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]",
      ghost: "backdrop-blur-md text-black border-white/50 hover:brightness-110",
    }
  };

  const currentVariantClass = variants[isAero ? 'aero' : 'duolingo'][variant];
  const dynamicStyle = isAero ? aeroStyles[variant] : {};

  return (
    <button 
      className={`${baseStyles} ${currentVariantClass} ${fullWidth ? 'w-full' : ''} ${className}`}
      style={dynamicStyle}
      {...props}
    >
      {isAero && <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />}
      {children}
    </button>
  );
};

export default Button;
