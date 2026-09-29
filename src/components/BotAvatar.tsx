import React from 'react';
import { AvatarShape } from '../types/bot';

interface BotAvatarProps {
  shape: AvatarShape;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  isWorking?: boolean;
}

export const BotAvatar: React.FC<BotAvatarProps> = ({
  shape,
  color,
  size = 'md',
  isWorking = false,
}) => {
  const px = size === 'sm' ? 24 : size === 'lg' ? 44 : 34;

  const getShape = () => {
    switch (shape) {
      case 'circle-teal':
        return (
          <svg width={px} height={px} viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="16" fill={color || '#2CB696'} />
            <rect x="10.5" y="10" width="2.4" height="5.2" rx="1.2" transform="rotate(-8 10.5 10)" fill="white" />
            <rect x="15" y="9.5" width="2.4" height="5.2" rx="1.2" transform="rotate(-8 15 9.5)" fill="white" />
          </svg>
        );

      case 'triangle-blue':
        return (
          <svg width={px} height={px} viewBox="0 0 36 36" fill="none">
            <path
              d="M14.6 4.8C16.1 2.1 20.0 2.1 21.5 4.8L32.7 24.8C34.2 27.5 32.3 30.8 29.2 30.8H6.9C3.8 30.8 1.9 27.5 3.4 24.8L14.6 4.8Z"
              fill={color || '#3562F4'}
            />
            <rect x="11.5" y="15.5" width="2.4" height="5" rx="1.2" transform="rotate(-10 11.5 15.5)" fill="white" />
            <rect x="15.8" y="15" width="2.4" height="5" rx="1.2" transform="rotate(-10 15.8 15)" fill="white" />
          </svg>
        );

      case 'diamond-purple':
        return (
          <svg width={px} height={px} viewBox="0 0 36 36" fill="none">
            <rect x="18" y="2.5" width="22" height="22" rx="6" transform="rotate(45 18 2.5)" fill={color || '#7A49F5'} />
            <rect x="11" y="11.5" width="2.4" height="5" rx="1.2" transform="rotate(10 11 11.5)" fill="white" />
            <rect x="15.4" y="12.2" width="2.4" height="5" rx="1.2" transform="rotate(10 15.4 12.2)" fill="white" />
          </svg>
        );

      case 'circle-blue':
        return (
          <svg width={px} height={px} viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="16" fill={color || '#2A79F7'} />
            <rect x="10.2" y="10" width="2.5" height="5.2" rx="1.25" transform="rotate(-6 10.2 10)" fill="white" />
            <rect x="14.8" y="9.6" width="2.5" height="5.2" rx="1.25" transform="rotate(-6 14.8 9.6)" fill="white" />
          </svg>
        );

      case 'circle-red':
        return (
          <svg width={px} height={px} viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="16" fill={color || '#EE6326'} />
            <rect x="10" y="10.5" width="2.5" height="5.2" rx="1.25" transform="rotate(6 10 10.5)" fill="white" />
            <rect x="14.6" y="11" width="2.5" height="5.2" rx="1.25" transform="rotate(6 14.6 11)" fill="white" />
          </svg>
        );

      case 'crew-multi':
        return (
          <svg width={px} height={px} viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="10.5" r="7.5" fill="#2CB696" stroke="white" strokeWidth="1.2" />
            <circle cx="10.5" cy="24" r="8" fill="#2A79F7" stroke="white" strokeWidth="1.2" />
            <circle cx="25" cy="24.5" r="8" fill="#7A49F5" stroke="white" strokeWidth="1.2" />
            <rect x="15" y="7.2" width="1.5" height="3" rx="0.75" fill="white" />
            <rect x="17.5" y="7.2" width="1.5" height="3" rx="0.75" fill="white" />
            <rect x="7.2" y="20.5" width="1.5" height="3" rx="0.75" fill="white" />
            <rect x="9.8" y="20.5" width="1.5" height="3" rx="0.75" fill="white" />
          </svg>
        );

      case 'custom-hex':
        return (
          <svg width={px} height={px} viewBox="0 0 36 36" fill="none">
            <rect x="4" y="4" width="28" height="28" rx="8" fill={color || '#10B981'} />
            <rect x="10.5" y="11" width="2.5" height="5" rx="1.25" fill="white" />
            <rect x="15.2" y="11" width="2.5" height="5" rx="1.25" fill="white" />
          </svg>
        );

      case 'violet-gem':
        return (
          <svg width={px} height={px} viewBox="0 0 36 36" fill="none">
            <defs>
              <linearGradient id="violetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#6366F1" />
              </linearGradient>
            </defs>
            <rect x="5" y="5" width="26" height="26" rx="9" fill={color || "url(#violetGrad)"} />
            <rect x="11" y="11.5" width="2.5" height="5.2" rx="1.2" transform="rotate(-6 11 11.5)" fill="white" />
            <rect x="15.5" y="11" width="2.5" height="5.2" rx="1.2" transform="rotate(-6 15.5 11)" fill="white" />
          </svg>
        );

      case 'sunset-coral':
        return (
          <svg width={px} height={px} viewBox="0 0 36 36" fill="none">
            <defs>
              <linearGradient id="sunsetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F43F5E" />
                <stop offset="100%" stopColor="#FB923C" />
              </linearGradient>
            </defs>
            <circle cx="18" cy="18" r="16" fill={color || "url(#sunsetGrad)"} />
            <rect x="10" y="10.5" width="2.5" height="5.2" rx="1.25" transform="rotate(8 10 10.5)" fill="white" />
            <rect x="14.5" y="11" width="2.5" height="5.2" rx="1.25" transform="rotate(8 14.5 11)" fill="white" />
          </svg>
        );

      case 'cyan-orb':
        return (
          <svg width={px} height={px} viewBox="0 0 36 36" fill="none">
            <defs>
              <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06B6D4" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
            </defs>
            <circle cx="18" cy="18" r="16" fill={color || "url(#cyanGrad)"} />
            <rect x="10" y="10" width="2.5" height="5.2" rx="1.25" transform="rotate(-8 10 10)" fill="white" />
            <rect x="14.8" y="9.5" width="2.5" height="5.2" rx="1.25" transform="rotate(-8 14.8 9.5)" fill="white" />
          </svg>
        );

      case 'emerald-badge':
        return (
          <svg width={px} height={px} viewBox="0 0 36 36" fill="none">
            <defs>
              <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
            </defs>
            <path
              d="M18 2L31 8V18C31 25.5 25.5 32 18 34C10.5 32 5 25.5 5 18V8L18 2Z"
              fill={color || "url(#emeraldGrad)"}
            />
            <rect x="11.5" y="12" width="2.4" height="5" rx="1.2" fill="white" />
            <rect x="15.8" y="12" width="2.4" height="5" rx="1.2" fill="white" />
          </svg>
        );

      case 'amber-star':
        return (
          <svg width={px} height={px} viewBox="0 0 36 36" fill="none">
            <defs>
              <linearGradient id="amberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
            </defs>
            <rect x="6" y="6" width="24" height="24" rx="7" transform="rotate(15 18 18)" fill={color || "url(#amberGrad)"} />
            <rect x="11" y="11" width="2.5" height="5.2" rx="1.2" transform="rotate(15 11 11)" fill="white" />
            <rect x="15.5" y="12" width="2.5" height="5.2" rx="1.2" transform="rotate(15 15.5 12)" fill="white" />
          </svg>
        );

      case 'neon-magenta':
        return (
          <svg width={px} height={px} viewBox="0 0 36 36" fill="none">
            <defs>
              <linearGradient id="magentaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#EC4899" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>
            <circle cx="18" cy="18" r="16" fill={color || "url(#magentaGrad)"} />
            <rect x="10.2" y="10.2" width="2.5" height="5.2" rx="1.2" transform="rotate(-6 10.2 10.2)" fill="white" />
            <rect x="14.8" y="10" width="2.5" height="5.2" rx="1.2" transform="rotate(-6 14.8 10)" fill="white" />
          </svg>
        );

      case 'circle-orange':
      default:
        return (
          <svg width={px} height={px} viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="16" fill={color || '#F29938'} />
            <rect x="9.5" y="10.5" width="2.5" height="5.2" rx="1.25" transform="rotate(8 9.5 10.5)" fill="white" />
            <rect x="14" y="11" width="2.5" height="5.2" rx="1.25" transform="rotate(8 14 11)" fill="white" />
          </svg>
        );
    }
  };

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${isWorking ? 'animate-pulse' : ''}`}>
      {getShape()}
    </div>
  );
};
