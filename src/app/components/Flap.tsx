'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface FlapOverlayProps {
  side: "left" | "right";
  leftChild: React.ReactNode;
  rightChild: React.ReactNode;
  flapStyles: string;
  containerStyles?: string;
  bothSides?: boolean;
}

const FlapOverlay: React.FC<FlapOverlayProps> = ({ 
  side, 
  leftChild, 
  rightChild, 
  flapStyles,
  containerStyles = '',
  bothSides = false
}) => {
  const isRight = side === "right";
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    setHasLoaded(true);
  }, []);

  return (
    <div className={`relative w-full h-full`}>
      <div className={`absolute inset-0 flex rounded-lg overflow-hidden`}>
        <div className="w-[calc(50%-0.5px)] flex items-center justify-center">{leftChild}</div>
        <div className="w-px bg-light-background-tertiary dark:bg-dark-background-tertiary" />
        <div className="w-[calc(50%-0.5px)] flex items-center justify-center">{rightChild}</div>
      </div>
      
      <motion.div
        className="absolute w-full top-0 h-full pointer-events-none"
        style={{ transformStyle: 'preserve-3d', transformPerspective: '500px' }}
        initial={{ rotateY: isRight ? 0 : 180 }}
        animate={{ rotateY: isRight ? 0 : 180 }}
        transition={hasLoaded ? { type: "tween", ease: "easeInOut", duration: 0.7 } : { duration: 0 }}
      >
        <div className={`absolute w-[calc(50%-0.59px)] inset-0 h-full rounded-l-lg flex items-center justify-center overflow-hidden ${flapStyles}`} />
      </motion.div>
        {bothSides && (
            <motion.div
            className="absolute w-full top-0 h-full pointer-events-none"
            style={{ transformStyle: 'preserve-3d', transformPerspective: '500px' }}
            initial={{ rotateY: !isRight ? 0 : 180 }}
            animate={{ rotateY: !isRight ? 0 : 180 }}
            transition={hasLoaded ? { type: "tween", ease: "easeInOut", duration: 0.7 } : { duration: 0 }}
            >
            <div className={`absolute w-[calc(50%-0.59px)] inset-0 h-full rounded-l-lg flex items-center justify-center overflow-hidden ${flapStyles}`} />
            </motion.div>
        )}
    </div>
  );
};

export default FlapOverlay;