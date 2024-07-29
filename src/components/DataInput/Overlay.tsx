'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import path from 'path';

type AnimationType = 'flap' | 'slider' | 'none';
type Mode = 'cover' | 'highlight';
export type Side = 'left' | 'right' | 'none';

interface OverlayProps {
  side: Side;
  leftChild: React.ReactNode;
  rightChild: React.ReactNode;
  animationType?: AnimationType;
  duration?: number;
  className?: string;
  mode: Mode;
}

const getParentStyle = (side: 'left' | 'right', currentSide: Side, mode: Mode) => {
  if (currentSide === 'none') {
    return 'opacity-90';
  }

  if (mode === 'highlight') {
    return side === currentSide ? 'font-bold' : 'opacity-90';
  } else { // cover mode
    const isBold = side !== currentSide ? 'font-medium' : '';
    return side === 'right' 
      ? `${isBold} text-light-accent dark:text-dark-accent`
      : `${isBold} text-light-primary dark:text-dark-primary`;
  }
};

const getCardStyle = (side: Side, mode: Mode) => {
  if (side === 'none') {
    return 'opacity-0';
  }

  if (mode === 'highlight') {
    
    return side === 'right'
      ? 'border-2 border-light-accent dark:border-dark-accent'
      : 'border-2 border-light-primary dark:border-dark-primary';
  } else { // cover mode
    return 'border-2 border-gray-500 bg-light-background/50 dark:bg-dark-background/50 backdrop-filter backdrop-grayscale backdrop-opacity-60';
  }
};

const animationVariants = {
  flap: (side: Side) => ({
    rotateY: side === 'left' ? 0 : (side === 'none' ? 90 : 180)
  }),
  slider: (side: Side) => ({
    x: side === 'left' ? '0.06%' : (side === 'none' ? '-25%' : '-50.1%')
  }),
  none: () => ({})
};

export const Overlay: React.FC<OverlayProps> = ({
  side,
  leftChild,
  rightChild,
  animationType = 'slider',
  duration = 0.6,
  className = '',
  mode = 'cover'
}) => {
  const [currentAnimationType, setCurrentAnimationType] = useState<AnimationType>(animationType);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (animationType !== currentAnimationType) {
      setCurrentAnimationType('none');
      setTimeout(() => {
        setCurrentAnimationType(animationType);
        setKey(prevKey => prevKey + 1);
      }, 50);
    }
  }, [animationType, currentAnimationType]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div className="absolute inset-0 flex rounded-md overflow-hidden">
        <div className={`w-[calc(50%+0.3px)] flex items-center justify-center transition-all duration-1000 ${
          getParentStyle('left', side, mode)
        }`}>
          {leftChild}
        </div>
        <div className="w-px bg-light-background-tertiary dark:bg-dark-background-tertiary" />
        <div className={`w-[calc(50%+0.3px)] flex items-center justify-center transition-all duration-1000 ${
          getParentStyle('right', side, mode)
        }`}>
          {rightChild}
        </div>
      </div>
      <div className={`absolute w-full top-0 h-full pointer-events-none overflow-hidden rounded-md backdrop-none z-1 ${side==='none' ? 'opacity-0 bg-gray-600' : 'opacity-100'}`}>
        <motion.div
          key={key}
          className="absolute w-full top-0 h-full pointer-events-none"
          style={currentAnimationType === 'flap' ? { 
            transformStyle: 'preserve-3d',
            transformPerspective: '500px'
          } : {}}
          initial={false}
          animate={animationVariants[currentAnimationType](side)}
          transition={{ type: "tween", ease: "easeInOut", duration }}
        >
          {currentAnimationType === 'flap' ? (
            <>
              <div
                style={{
                  position: 'absolute',
                  width: '50%',
                  height: '100%',
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(0deg)',
                }}
                className={`rounded-l-lg flex items-center justify-center overflow-hidden ${getCardStyle('left', mode)}`}
              />
              <div
                style={{
                  position: 'absolute',
                  width: '50%',
                  height: '100%',
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
                className={`rounded-r-lg flex items-center justify-center overflow-hidden ${getCardStyle('right', mode)}`}
              />
            </>
          ) : (
            <div className="flex h-full w-[150%]">
              <div className="w-[51%] h-full bg-light-background/50 dark:bg-dark-background/5 backdrop-effect relative">
                <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj4KICA8ZmlsdGVyIGlkPSJzbW9vdGhTYW5kYmxhc3QiPgogICAgPGZlVHVyYnVsZW5jZSB0eXBlPSJ0dXJidWxlbmNlIiBiYXNlRnJlcXVlbmN5PSIwLjc1IiBudW1PY3RhdmVzPSI0IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIiByZXN1bHQ9Im5vaXNlIi8+CiAgICA8ZmVDb2xvck1hdHJpeCB0eXBlPSJzYXR1cmF0ZSIgdmFsdWVzPSIwIiByZXN1bHQ9Im5vaXNlMiIvPgogICAgPGZlQ29tcG9zaXRlIGluPSJub2lzZTIiIGluMj0ibm9pc2UyIiBvcGVyYXRvcj0iYXJpdGhtZXRpYyIgazE9IjAiIGsyPSIwLjUiIGszPSIwLjUiIGs0PSIwIiByZXN1bHQ9ImZpbmFsTm9pc2UiLz4KICA8L2ZpbHRlcj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsdGVyPSJ1cmwoI3Ntb290aFNhbmRibGFzdCkiLz4KPC9zdmc+')]"></div>
              </div>
              <div className="w-[49.8%] h-full -mx-[3px] rounded-md border-2 z-10 border-zinc-700"></div>
              <div className="w-[51%] h-full bg-light-background/50 dark:bg-dark-background/5 backdrop-effect relative">
                <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj4KICA8ZmlsdGVyIGlkPSJzbW9vdGhTYW5kYmxhc3QiPgogICAgPGZlVHVyYnVsZW5jZSB0eXBlPSJ0dXJidWxlbmNlIiBiYXNlRnJlcXVlbmN5PSIwLjc1IiBudW1PY3RhdmVzPSI0IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIiByZXN1bHQ9Im5vaXNlIi8+CiAgICA8ZmVDb2xvck1hdHJpeCB0eXBlPSJzYXR1cmF0ZSIgdmFsdWVzPSIwIiByZXN1bHQ9Im5vaXNlMiIvPgogICAgPGZlQ29tcG9zaXRlIGluPSJub2lzZTIiIGluMj0ibm9pc2UyIiBvcGVyYXRvcj0iYXJpdGhtZXRpYyIgazE9IjAiIGsyPSIwLjUiIGszPSIwLjUiIGs0PSIwIiByZXN1bHQ9ImZpbmFsTm9pc2UiLz4KICA8L2ZpbHRlcj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsdGVyPSJ1cmwoI3Ntb290aFNhbmRibGFzdCkiLz4KPC9zdmc+')]"></div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};