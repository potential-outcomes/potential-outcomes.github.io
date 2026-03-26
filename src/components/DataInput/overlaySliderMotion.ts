import { motionValue, type MotionValue } from "framer-motion";

/** Persists slider translate across Overlay remounts (e.g. last row → sortable row) so x animation is continuous. */
const sliderXByRowId = new Map<string, MotionValue<string>>();

export function getOverlaySliderX(rowId: string): MotionValue<string> {
  let mv = sliderXByRowId.get(rowId);
  if (!mv) {
    mv = motionValue("0");
    sliderXByRowId.set(rowId, mv);
  }
  return mv;
}

export function releaseOverlaySliderX(rowId: string): void {
  sliderXByRowId.delete(rowId);
}
