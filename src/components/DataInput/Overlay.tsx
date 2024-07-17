'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

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
    return side == currentSide ? 'font-bold' : 'opacity-90';
  } else { // cover mode
    return side === 'right' ? 'font-bold text-light-accent dark:text-dark-accent' : 'font-bold text-light-primary dark:text-dark-primary';
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
    x: side === 'left' ? '0%' : (side === 'none' ? '25%' : '50%')
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
  mode = 'highlight',
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
      <div className="absolute inset-0 flex rounded-lg overflow-hidden">
        <div className={`w-[calc(50%-0.5px)] flex items-center justify-center transition-all duration-1000 ${
          getParentStyle('left', side, mode)
        }`}>
          {leftChild}
        </div>
        <div className="w-px bg-light-background-tertiary dark:bg-dark-background-tertiary" />
        <div className={`w-[calc(50%+0.5px)] flex items-center justify-center transition-all duration-1000 ${
          getParentStyle('right', side, mode)
        }`}>
          {rightChild}
        </div>
      </div>
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
          <div 
            className={`w-1/2 h-full rounded-lg ${getCardStyle(side, mode)}`}
          />
        )}
      </motion.div>
    </div>
  );
};