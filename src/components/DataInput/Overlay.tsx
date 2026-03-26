"use client";

import React, { useState, useEffect, ReactNode, useRef } from "react";
import { animate, motion, useMotionValue, MotionValue } from "framer-motion";
import { Icons } from "../common/Icons";
import { getOverlaySliderX } from "./overlaySliderMotion";

interface OverlayProps {
  assignment: number | null;
  duration?: number;
  className?: string;
  children: ReactNode[];
  setAssignment?: (assignment: number | null) => void;
  rowIndex: number;
  /** Stable row id — reuses the same motion value when the row wrapper remounts (keeps slider animation). */
  rowId?: string;
  columnColors: string[];
}

const MIN_SHADOW = 10;
const MAX_SHADOW = 13;
const SHADOW_RANGE = MAX_SHADOW - MIN_SHADOW;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

const getParentStyle = (position: number, assignment: number | null, color: string): string => {
  if (assignment === null) return "";
  const isBold = position !== assignment ? "font-medium" : "";
  return `${isBold} ${color} text-shadow-inherit`;
};

const createGrainyTextureSVG = (baseFrequency = 0.65, numOctaves = 4, opacity = 0.15): string => {
  return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='${baseFrequency}' numOctaves='${numOctaves}' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23noise)' opacity='${opacity}'/%3E%3C/svg%3E")`;
};

const useBoxShadow = (x: MotionValue<string>): [number, number] => {
  const [rightShadow, setRightShadow] = useState(MAX_SHADOW);
  const [leftShadow, setLeftShadow] = useState(MIN_SHADOW);

  useEffect(() => {
    const apply = (latest: string) => {
      const xPercent = parseFloat(latest);
      const t = clamp01(Number.isFinite(xPercent) ? xPercent / 100 : 0);
      setLeftShadow(MIN_SHADOW + SHADOW_RANGE * t);
      setRightShadow(MIN_SHADOW + SHADOW_RANGE * (1 - t));
    };
    apply(x.get());
    const unsubscribe = x.on("change", apply);
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
  panelTransitionMs: number;
}

const SliderPanel: React.FC<SliderPanelProps> = ({
  isLeft,
  shadowSize,
  assignment,
  setAssignment,
  numChildren,
  color,
  panelTransitionMs,
}) => (
  <div
    className={`h-full bg-slate-950/70 border-slate-700/60 border-y-2 backdrop-effect relative opacity-70 overflow-hidden flex items-center cursor-text ${
      isLeft ? "border-r-2 justify-end pr-2" : "border-l-2 pl-2"
    } ${
      assignment === null ?
        isLeft ? "mr-[75%]"
        : "ml-[75%]"
      : ""
    } transition-[margin] duration-700 ${color}`}
    style={{
      boxShadow: `${isLeft ? shadowSize : -shadowSize}px 0 7px -1px rgb(0 0 0 / 0.4)`,
      width: `${(100.0 * numChildren) / (2 * numChildren + 1)}%`,
      transitionDuration: `${panelTransitionMs}ms`,
    }}
  >
    <div
      className="absolute inset-0 mix-blend-overlay cursor-text"
      style={{
        backgroundImage: createGrainyTextureSVG(0.4, 3, 0.15),
        backgroundRepeat: "repeat",
      }}
    />
    <div
      className={`absolute text-white opacity-25 cursor-pointer z-50 pointer-events-auto -mx-2`}
      onClick={() =>
        setAssignment?.(
          assignment == null ? assignment
          : isLeft ? Math.max(0, assignment - 1)
          : Math.min(numChildren - 1, assignment + 1),
        )
      }
    >
      {isLeft ?
        <Icons.DottedLeft size={5} />
      : <Icons.DottedRight size={5} />}
    </div>
  </div>
);

export const Overlay: React.FC<OverlayProps> = ({
  assignment,
  duration = 0.5,
  className = "",
  children,
  setAssignment,
  rowIndex,
  rowId,
  columnColors,
}) => {
  const fallbackX = useMotionValue("0");
  const x: MotionValue<string> = rowId ? getOverlaySliderX(rowId) : fallbackX;
  const [leftShadow, rightShadow] = useBoxShadow(x);
  const prevAssignmentRef = useRef<number | null>(assignment);
  const hasMountedRef = useRef(false);
  // After removing x-travel for null->assigned, the margin animation is the primary reveal.
  // Keep it slightly longer to match the previous perceived speed.
  const panelTransitionMs = Math.max(900, Math.round(duration * 1800));

  /** Imperative animate() — `style={{ x }}` + `animate={{ x }}` together skip tweening the MV; animating the MV fixes remounts. */
  useEffect(() => {
    const cols = Math.max(children.length, 1);
    const target = assignment === null ? "0%" : `${assignment * (100 / cols) + 50 / cols}%`;
    const prevAssignment = prevAssignmentRef.current;
    prevAssignmentRef.current = assignment;

    // On first mount (including remount after row wrapper swap), place slider at target
    // so reveal comes from panel margins rather than x translating from the left.
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      x.set(target);
      return;
    }

    // Restore the original "panels close from edges" reveal:
    // when null -> assigned, position the slider immediately and let margin transitions do the visual work.
    if (prevAssignment === null && assignment !== null) {
      x.set(target);
      return;
    }

    const controls = animate(x, target, {
      type: "tween",
      ease: "easeInOut",
      duration,
    });
    return () => controls.stop();
  }, [assignment, duration, children.length, x]);

  const renderSliderAnimation = () => (
    <div
      className={`h-full flex flex-row justify-center gap-0 absolute -translate-x-1/2`}
      style={{
        width: `${(100 / children.length) * (2 * children.length + 1)}%`,
      }}
    >
      <SliderPanel
        isLeft={true}
        shadowSize={leftShadow}
        assignment={assignment}
        setAssignment={setAssignment}
        numChildren={children.length}
        color={assignment !== null ? columnColors[assignment] : ""}
        panelTransitionMs={panelTransitionMs}
      />
      <div
        className={`h-full -mx-[38px] z-0`}
        style={{
          width: `${100 / (1 * children.length + 3)}%`,
        }}
      />
      <SliderPanel
        isLeft={false}
        shadowSize={rightShadow}
        assignment={assignment}
        setAssignment={setAssignment}
        numChildren={children.length}
        color={assignment !== null ? columnColors[assignment] : ""}
        panelTransitionMs={panelTransitionMs}
      />
    </div>
  );

  return (
    <div className={`relative w-full h-full ${className} rounded-md border-1 border-slate-500/10`}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full h-[98%] flex rounded-md overflow-hidden">
          {children.map((child, index) => (
            <div
              key={index}
              className={`flex-1 min-w-0 flex items-center justify-center transition-all duration-200 ${getParentStyle(index, assignment, columnColors[index])} no-obstruct-${rowIndex}`}
            >
              {child}
            </div>
          ))}
        </div>
      </div>
      <div
        className={`absolute w-full top-0 h-full pointer-events-none overflow-hidden rounded-md ${assignment === null ? "opacity-0 bg-gray-600" : "opacity-100"}`}
      >
        <motion.div className="absolute w-full top-0 h-full" style={{ x }}>
          {renderSliderAnimation()}
        </motion.div>
      </div>
      <div
        className="absolute inset-0 rounded-md pointer-events-none"
        style={{
          boxShadow: `
            inset 0 10px 10px -3px rgba(0, 0, 0, 0.2),
            inset 0 -10px 10px -3px rgba(0, 0, 0, 0.2),
            inset 10px 0 10px -3px rgba(0, 0, 0, 0.4),
            inset -10px 0 10px -3px rgba(0, 0, 0, 0.4)
          `,
        }}
      />
    </div>
  );
};
