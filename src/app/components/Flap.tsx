'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface FlapOverlayProps {
  side: "left" | "right" | "none";
  leftChild: React.ReactNode;
  rightChild: React.ReactNode;
}

interface FaceProps {
  isBack?: boolean;
  children?: React.ReactNode;
  className?: string;
}

const Face: React.FC<FaceProps> = ({ isBack = false, children, className }) => (
  <div
    style={{
      position: 'absolute',
      width: '50%',
      height: '100%',
      backfaceVisibility: 'hidden',
      transform: isBack ? 'rotateY(180deg)' : 'rotateY(0deg)',
    }}
    className={className}
  >
    {children}
  </div>
);

const FlapOverlay: React.FC<FlapOverlayProps> = ({
  side,
  leftChild,
  rightChild,
}) => {
  const isRight = side === "right";
  const isNone = side === "none";
  const isLeft = side === "left";
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    setHasLoaded(true);
  }, []);

  return (
    <div className="relative w-full h-full">
      <div className="absolute inset-0 flex rounded-lg overflow-hidden">
        <div className={`w-[calc(50%-0.5px)] flex items-center justify-center transition-font-weight duration-500 ${isLeft ? 'font-bold' : 'opacity-90'}`}>
          {leftChild}
        </div>
        <div className="w-px bg-light-background-tertiary dark:bg-dark-background-tertiary" />
        <div className={`w-[calc(50%+0.5px)] flex items-center justify-center transition-font-weight duration-500 ${isRight ? 'font-bold' : 'opacity-90'}`}>
          {rightChild}
        </div>
      </div>
      <motion.div
        className="absolute w-full top-0 h-full pointer-events-none"
        style={{ 
          transformStyle: 'preserve-3d',
          transformPerspective: '500px'
        }}
        initial={false}
        animate={{ rotateY: isLeft ? 0 : (isNone ? 90 : 180) }}
        transition={hasLoaded ? { type: "tween", ease: "easeInOut", duration: 0.7 } : { duration: 0 }}
      >
        <Face className="rounded-l-lg flex items-center justify-center overflow-hidden border-2 border-light-accent dark:border-dark-accent" />
        <Face isBack className="rounded-r-lg flex items-center justify-center overflow-hidden border-2 border-light-primary dark:border-dark-primary" />
      </motion.div>
    </div>
  );
};

export default FlapOverlay;