'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { motion, useMotionValue, MotionValue } from 'framer-motion';
import { Icons } from '../common/Icons';

interface OverlayProps {
  assignment: number | null;
  duration?: number;
  className?: string;
  children: ReactNode[];
  setAssignment?: (assignment: number | null) => void;
  index: number;
  columnColors: string[];
}

const MIN_SHADOW = 10;
const MAX_SHADOW = 13;
const SHADOW_RANGE = MAX_SHADOW - MIN_SHADOW;

const getParentStyle = (position: number, assignment: number | null, color: string): string => {
  if (assignment === null) return '';
  const isBold = position !== assignment ? 'font-medium' : '';
  return `${isBold} ${color} text-shadow-inherit`;
};

const createGrainyTextureSVG = (
  baseFrequency = 0.65,
  numOctaves = 4,
  opacity = 0.15
): string => {
  return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='${baseFrequency}' numOctaves='${numOctaves}' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23noise)' opacity='${opacity}'/%3E%3C/svg%3E")`;
};

const useBoxShadow = (x: MotionValue<string>): [number, number] => {
  const [rightShadow, setRightShadow] = useState(0);
  const [leftShadow, setLeftShadow] = useState(MIN_SHADOW);

  useEffect(() => {
    const unsubscribe = x.on('change', (latest: string) => {
      const xPercent = parseFloat(latest);
      const normalizedX = (xPercent + 50.1) / 50.16;
      
      setLeftShadow(MIN_SHADOW + SHADOW_RANGE * normalizedX);
      setRightShadow(MIN_SHADOW + SHADOW_RANGE * (1 - normalizedX));
    });

    return () => unsubscribe();
  }, [x]);

  return [leftShadow, rightShadow];
};

interface SliderPanelProps {
  isLeft: boolean;
  shadowSize: number;
  assignment: number | null;
  setAssignment?: (assignment: number | null) => void;
  numChildren: number;
  color: string;
}

const SliderPanel: React.FC<SliderPanelProps> = ({ isLeft, shadowSize, assignment, setAssignment, numChildren, color }) => (
  <div 
    className={`h-full bg-slate-950/70 border-slate-700/60 border-y-2 backdrop-effect relative opacity-70 overflow-hidden flex items-center cursor-text ${
      isLeft ? 'border-r-2 justify-end pr-2' : 'border-l-2 pl-2'
    } ${
      assignment === null ? (isLeft ? 'mr-[60%]' : 'ml-[60%]') : ''
    } transition-[margin] duration-700 ${color}`}
    style={{
      boxShadow: `${isLeft ? shadowSize : -shadowSize}px 0 7px -1px rgb(0 0 0 / 0.4)`,
      width: `${(100.0 * (numChildren)) / ((2 * numChildren) + 1)}%`
    }}
  >
    <div
      className="absolute inset-0 mix-blend-overlay cursor-text"
      style={{
        backgroundImage: createGrainyTextureSVG(0.4, 3, 0.15),
        backgroundRepeat: 'repeat'
      }}
    />
    <div 
      className={`absolute text-white opacity-25 cursor-pointer z-50 pointer-events-auto -mx-2`}
      onClick={() => setAssignment?.(assignment == null ? assignment : isLeft ? Math.max(0, assignment - 1) : Math.min(numChildren - 1, assignment + 1))}
    >
      {isLeft? <Icons.DottedLeft size={5} /> : <Icons.DottedRight size={5} />}
    </div>
  </div>
);

export const Overlay: React.FC<OverlayProps> = ({
  assignment,
  duration = 0.5,
  className = '',
  children,
  setAssignment,
  index,
  columnColors
}) => {
  const x = useMotionValue('0');
  const [leftShadow, rightShadow] = useBoxShadow(x);

  const renderSliderAnimation = () => (
    <div 
      className={`h-full flex flex-row justify-center gap-0 absolute -translate-x-1/2`} 
      style={{
        width: `${(100 / children.length) * ((2 * children.length) + 1)}%`,
      }}
    >
      <SliderPanel 
        isLeft={true} 
        shadowSize={leftShadow} 
        assignment={assignment} 
        setAssignment={setAssignment} 
        numChildren={children.length}
        color={assignment !== null ? columnColors[assignment] : ''}
      />
      <div className={`h-full -mx-[35px] z-0`} 
      style={{
        width: `${100 / ((2 * children.length) + 1)}%`
      }}
      />
      <SliderPanel 
        isLeft={false} 
        shadowSize={rightShadow} 
        assignment={assignment} 
        setAssignment={setAssignment} 
        numChildren={children.length}
        color={assignment !== null ? columnColors[assignment] : ''}
      />
    </div>
  );

  return (
    <div className={`relative w-full h-full ${className} rounded-md border-1 border-slate-500/10`}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full h-[98%] flex rounded-md overflow-hidden">
          {children.map((child, index) => (
            <div key={index} className={`w-[50%] flex items-center justify-center transition-all duration-300 ${getParentStyle(index, assignment, columnColors[index])}`}>
              {child}
            </div>
          ))}
        </div>
      </div>
      <div className={`absolute w-full top-0 h-full pointer-events-none overflow-hidden rounded-md ${assignment === null ? 'opacity-0 bg-gray-600' : 'opacity-100'}`}>
        <motion.div
          className="absolute w-full top-0 h-full"
          initial={false}
          animate={{
            x: assignment === null ? '25%' : `${assignment * (100 / children.length) + (50 / children.length)}%`
          }}
          transition={{ type: "tween", ease: "easeInOut", duration }}
          style={{ x }}
        >
          {renderSliderAnimation()}
        </motion.div>
      </div>
      <div className="absolute inset-0 rounded-md pointer-events-none"
        style={{
          boxShadow: `
            inset 0 10px 10px -3px rgba(0, 0, 0, 0.2),
            inset 0 -10px 10px -3px rgba(0, 0, 0, 0.2),
            inset 10px 0 10px -3px rgba(0, 0, 0, 0.4),
            inset -10px 0 10px -3px rgba(0, 0, 0, 0.4)
          `
        }}
      />
    </div>
  );
};