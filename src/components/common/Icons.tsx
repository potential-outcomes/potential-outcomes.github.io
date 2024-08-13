// components/Icons.tsx
import React from 'react';
import PropTypes from 'prop-types';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
  onClick?: (event: React.MouseEvent<SVGSVGElement, MouseEvent>) => void;
}

const SvgIcon: React.FC<IconProps & React.SVGProps<SVGSVGElement>> = ({ 
  size = null, 
  color = 'currentColor', 
  className = '', 
  onClick,
  children, 
  ...props 
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`h-${size ?? 'full'} w-${size ?? 'full'} ${className}`}
    onClick={onClick}
    {...props}
  >
    {children}
  </svg>
);

SvgIcon.propTypes = {
  size: PropTypes.number,
  color: PropTypes.string,
  className: PropTypes.string,
  onClick: PropTypes.func,
};

export const Undo: React.FC<IconProps> = (props) => (
  <SvgIcon viewBox="0 0 24 24" {...props}>
    <path d="M9 14L4 9L9 4" />
    <path d="M4 9H15C18.3137 9 21 11.6863 21 15C21 18.3137 18.3137 21 15 21H12" />
  </SvgIcon>
);

export const Redo: React.FC<IconProps> = (props) => (
  <SvgIcon viewBox="0 0 24 24" {...props}>
    <path d="M15 14L20 9L15 4" />
    <path d="M20 9H9C5.68629 9 3 11.6863 3 15C3 18.3137 5.68629 21 9 21H12" />
  </SvgIcon>
);


export const Expand: React.FC<IconProps> = (props) => (
  <SvgIcon viewBox="0 0 24 24" {...props}>
    <path d="M18 9L12 3L6 9" />
    <path d="M18 15L12 21L6 15" />
  </SvgIcon>
);

export const Collapse: React.FC<IconProps> = (props) => (
  <SvgIcon viewBox="0 0 24 24" {...props}>
    <path d="M18 4L12 10L6 4" />
    <path d="M18 20L12 14L6 20" />
  </SvgIcon>
);

export const Close: React.FC<IconProps> = (props) => (
  <SvgIcon viewBox="0 0 24 24" {...props}>
    <path d="M18 6L6 18M6 6l12 12" />
  </SvgIcon>
);

export const Add: React.FC<IconProps> = (props) => (
  <SvgIcon viewBox="0 0 24 24" {...props}>
    <path d="M12 5v14M5 12h14" />
  </SvgIcon>
);

export const Moon: React.FC<IconProps> = (props) => (
  <SvgIcon viewBox="0 0 24 24" {...props}>
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
  </SvgIcon>
);

export const Sun: React.FC<IconProps> = (props) => (
  <SvgIcon viewBox="0 0 24 24" {...props}>
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </SvgIcon>
);

export const Upload: React.FC<IconProps> = (props) => (
  <SvgIcon viewBox="0 0 24 24" {...props}>
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
  </SvgIcon>
);

export const MagicWand: React.FC<IconProps> = (props) => (
  <SvgIcon viewBox="0 0 24 24" {...props}>
    <path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8L19 13M17.8 6.2L19 5M3 21l9-9M12.2 6.2L11 5" />
  </SvgIcon>
);

export const Edit: React.FC<IconProps> = (props) => (
  <SvgIcon viewBox="0 0 24 24" {...props}>
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </SvgIcon>
);

export const Cancel: React.FC<IconProps> = (props) => (
  <SvgIcon viewBox="0 0 24 24" {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
  </SvgIcon>
);

export const Flask: React.FC<IconProps> = (props) => (
  <SvgIcon viewBox="0 0 24 24" {...props}>
    <path d="M6 22a2 2 0 002 2h8a2 2 0 002-2l-3-16H9L6 22z" />
    <path d="M9 2v3h6V2H9z" />
  </SvgIcon>
);

export const Play: React.FC<IconProps> = (props) => (
  <SvgIcon viewBox="0 0 24 24" {...props}>
    <polygon points="5 3 19 12 5 21 5 3" />
  </SvgIcon>
);

export const Pause: React.FC<IconProps> = (props) => (
  <SvgIcon viewBox="0 0 24 24" {...props}>
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </SvgIcon>
);

export const Continue: React.FC<IconProps> = (props) => (
  <SvgIcon viewBox="0 0 24 24" {...props}>
    <rect x="8" y="4" width="3" height="16" />
    <polygon points="15 4 23 12 15 20 15 4" />
  </SvgIcon>
);

export const Clear: React.FC<IconProps> = (props) => (
  <SvgIcon viewBox="0 0 24 24" {...props}>
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </SvgIcon>
);

export const RewindPlay: React.FC<IconProps> = (props) => (
  <SvgIcon viewBox="0 0 24 24" {...props}>
    {/* Play triangle */}
    <polygon points="8 7 16 12 8 17 8 7" />
    
    {/* Circular arrow */}
    <path 
      d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12s4.48 10 10 10c4.04 0 7.54-2.4 9.13-5.85" 
      fill="none" 
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    
    {/* Arrow head */}
    <polygon points="22 12 19 8.5 19 15.5" />
  </SvgIcon>
);

export const SixDots: React.FC<IconProps> = (props) => (
  <SvgIcon viewBox="0 0 24 24" {...props}>
    <circle cx="4" cy="6" r="2" />
    <circle cx="4" cy="12" r="2" />
    <circle cx="4" cy="18" r="2" />
    <circle cx="12" cy="6" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="12" cy="18" r="2" />
  </SvgIcon>
);

export const Icons = {
  Undo,
  Redo,
  Expand,
  Collapse,
  Close,
  Add,
  Moon,
  Sun,
  Upload,
  MagicWand,
  Edit,
  Cancel,
  Flask,
  Play,
  Pause,
  Continue,
  Clear,
  RewindPlay,
  SixDots, // Add the new icon here
};

export default Icons;