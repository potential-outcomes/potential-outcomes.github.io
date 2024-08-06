'use client';

import React, { useState, useEffect } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { Icons } from '../common/Icons';

export type Side = 'left' | 'right' | 'none';

interface OverlayProps {
  side: Side;
  leftChild: React.ReactNode;
  rightChild: React.ReactNode;
  duration?: number;
  className?: string;
}

const getParentStyle = (side: 'left' | 'right', currentSide: Side): string => {
  if (currentSide === 'none') return '';
  const isBold = side !== currentSide ? 'font-medium' : '';
  return side === 'right' 
    ? `${isBold} text-light-accent dark:text-dark-accent text-shadow-inherit`
    : `${isBold} text-light-primary dark:text-dark-primary text-shadow-inherit`;
};

const createGrainyTextureSVG = (baseFrequency = 0.65, numOctaves = 4, opacity = 0.15) => {
  return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='${baseFrequency}' numOctaves='${numOctaves}' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23noise)' opacity='${opacity}'/%3E%3C/svg%3E")`;
};

export const Overlay: React.FC<OverlayProps> = ({
  side,
  leftChild,
  rightChild,
  duration = 0.6,
  className = '',
}) => {
  const x = useMotionValue('0');
  const [rightShadow, setRightShadow] = useState(0);
  const [leftShadow, setLeftShadow] = useState(10);

  useEffect(() => {
    const unsubscribe = x.on('change', (latest: string) => {
      const xPercent = parseFloat(latest);
      
      // Normalize x to a value between 0 and 1
      const normalizedX = (xPercent + 50.1) / 50.16;
      
      // Calculate shadow sizes
      const maxShadow = 13;
      const minShadow = 10;
      const shadowRange = maxShadow - minShadow;

      setLeftShadow(minShadow + shadowRange * normalizedX);
      setRightShadow(minShadow + shadowRange * (1 - normalizedX));
    });

    return () => unsubscribe();
  }, [x]);

  const renderSliderAnimation = () => (
    <div className={`flex h-full w-[150%]`}>
      {/* left panel */}
      <div 
        className={`w-[58%] h-full bg-slate-950/80 border-slate-700/60 border-r-2 border-y-2 backdrop-effect relative opacity-75 overflow-hidden flex items-center justify-end pr-2 ${side === 'none' ? 'mr-[60%]' : ''} transition-[margin] duration-1000`}
        style={{
          boxShadow: `${leftShadow}px 0 7px -1px rgb(0 0 0 / 0.4)`
        }}
      >
        <div
          className="absolute inset-0 mix-blend-overlay"
          style={{
            backgroundImage: createGrainyTextureSVG(0.4, 3, 0.15),
            backgroundRepeat: 'repeat'
          }}
        />
        <Icons.SixDots size={5} className="text-white opacity-25 -mr-2"/>
      </div>
  
      {/* middle empty */}
      <div className={`w-[30%] h-full -mx-[0px] z-10`} />
      
      {/* right panel */}
      <div 
        className={`w-[58%] h-full bg-slate-950/80 border-slate-700/60 border-l-2 border-y-2 backdrop-effect relative opacity-75 overflow-hidden flex items-center pl-2 ${side === 'none' ? 'ml-[60%]' : ''} transition-[margin] duration-1000`}
        style={{
          boxShadow: `-${rightShadow}px 0 7px -1px rgb(0 0 0 / 0.4)`
        }}
      >
        <div
          className="absolute inset-0 mix-blend-overlay"
          style={{
            backgroundImage: createGrainyTextureSVG(0.4, 3, 0.15),
            backgroundRepeat: 'repeat'
          }}
        />
        <Icons.SixDots size={5} className="text-white opacity-25" />
      </div>
    </div>
  );

  return (
    <div className={`relative w-full h-full ${className} rounded-md border-1 border-slate-500/10`}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full h-[98%] flex rounded-md overflow-hidden"
        >
          <div className={`w-[calc(50%+0.3px)] flex items-center justify-center transition-all duration-500 ${
            getParentStyle('left', side)
          }`}>
            {leftChild}
          </div>
          <div className={`w-[calc(50%+0.3px)] flex items-center justify-center transition-all duration-500 ${
            getParentStyle('right', side)
          }`}>
            {rightChild}
          </div>
        </div>
      </div>
      <div className={`absolute w-full top-0 h-full pointer-events-none overflow-hidden rounded-md z-1 ${side === 'none' ? 'opacity-0 bg-gray-600' : 'opacity-100'}`}>
        <motion.div
          className="absolute w-full top-0 h-full pointer-events-none"
          initial={false}
          animate={{
            x: side === 'left' ? '0.06%' : (side === 'none' ? '-25%' : '-50.1%')
          }}
          transition={{ type: "tween", ease: "easeInOut", duration }}
          style={{ x }}
        >
          {renderSliderAnimation()}
        </motion.div>
      </div>
      {/* add shadow */}
      <div className={`absolute inset-0 rounded-md z-0 pointer-events-none`}
      style={{
        boxShadow: `
        inset 0 10px 10px -3px rgba(0, 0, 0, 0.2),
        inset 0 -10px 10px -3px rgba(0, 0, 0, 0.2),
        inset 10px 0 10px -3px rgba(0, 0, 0, 0.4),
        inset -10px 0 10px -3px rgba(0, 0, 0, 0.4)
      `
      }}/>
    </div>
  );
};