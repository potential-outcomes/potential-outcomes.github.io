import React, { useEffect, useMemo } from 'react';
import { motion, AnimatePresence, cubicBezier } from 'framer-motion';
import ReactDOM from 'react-dom';

interface PhantomNumberProps {
  value: number;
  startPosition: { x: number; y: number };
  endPosition: { x: number; y: number };
  onAnimationComplete: () => void;
  color: string;
  duration?: number;
  delay?: number;
}

const PhantomNumber: React.FC<PhantomNumberProps> = ({
  value,
  startPosition,
  endPosition,
  onAnimationComplete,
  color,
  duration = 1,
  delay = 0.1,
}) => {
  const distanceX = endPosition.x - startPosition.x;
  const distanceY = endPosition.y - startPosition.y;

  const arcPoints = useMemo(() => {
    const numPoints = 100; // More points for smoother arc
    const maxHeight = Math.min(Math.abs(distanceY), Math.abs(distanceX)) * 0.5; // Adjust this factor to control arc height
    const controlPoint = { x: distanceX / 2, y: -maxHeight };

    return Array.from({ length: numPoints }, (_, i) => {
      const t = i / (numPoints - 1);
      const x = (1 - t) * (1 - t) * 0 + 2 * (1 - t) * t * controlPoint.x + t * t * distanceX;
      const y = (1 - t) * (1 - t) * 0 + 2 * (1 - t) * t * controlPoint.y + t * t * distanceY;
      return { x, y };
    });
  }, [distanceX, distanceY]);

  const variants = {
    initial: {
      x: 0,
      y: 0,
      opacity: 1,
      scale: 1,
    },
    animate: {
      x: arcPoints.map(p => p.x),
      y: arcPoints.map(p => p.y),
      transition: {
        delay: delay,
        duration: duration * 0.85,
        ease: cubicBezier(0.45, 0, 0.55, 1), // Custom ease for smooth motion
        times: arcPoints.map((_, i) => i / (arcPoints.length - 1)),
      },
    },
    fadeOut: {
      opacity: 0,
      scale: 0.9,
      transition: {
        duration: duration * 0.1,
        ease: "easeOut",
      },
    },
  };

  useEffect(() => {
    const timer = setTimeout(onAnimationComplete, (delay + duration) * 1000);
    return () => clearTimeout(timer);
  }, [delay, duration, onAnimationComplete]);

  const phantomElement = (
    <AnimatePresence>
      <motion.div
        initial="initial"
        animate="animate"
        exit="fadeOut"
        variants={variants}
        onAnimationComplete={onAnimationComplete}
        style={{
          position: 'fixed',
          left: startPosition.x,
          top: startPosition.y,
          color: color,
          fontSize: '1rem',
          fontWeight: 'bold',
          pointerEvents: 'none',
          zIndex: 9999,
        }}
      >
        {value}
      </motion.div>
    </AnimatePresence>
  );

  return ReactDOM.createPortal(phantomElement, document.body);
};

export default PhantomNumber;