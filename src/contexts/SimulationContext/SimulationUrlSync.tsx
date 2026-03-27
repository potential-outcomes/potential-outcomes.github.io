"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useFullSimulationContext } from "./hooks";
import {
  parseSimulationUrlParam,
  serializeSimulationUrlParam,
  SIMULATION_URL_QUERY_KEY,
} from "@/lib/simulationUrlState";

const DEBOUNCE_MS = 400;

/**
 * Reads shareable config from `?d=` on mount and keeps the URL in sync (debounced, replace).
 */
export function SimulationUrlSync() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, settings, plot, hydrateFromUrl } = useFullSimulationContext();

  const hydratedRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (hydratedRef.current) return;
    const raw = searchParams.get(SIMULATION_URL_QUERY_KEY);
    if (raw) {
      const parsed = parseSimulationUrlParam(raw);
      if (parsed) hydrateFromUrl(parsed);
    }
    hydratedRef.current = true;
  }, [searchParams, hydrateFromUrl]);

  const userData = data.userData;

  const syncToUrl = useCallback(() => {
    if (!hydratedRef.current) return;
    const serialized = serializeSimulationUrlParam({
      userData,
      settings: {
        simulationSpeed: settings.simulationSpeed,
        selectedTestStatistic: settings.selectedTestStatistic,
        totalSimulations: settings.totalSimulations,
        pValueType: settings.pValueType,
      },
      plot: {
        thresholdDirection: plot.thresholdDirection,
        thresholdInput: plot.thresholdInput,
      },
    });
    if (serialized === null) return;

    const current = searchParams.get(SIMULATION_URL_QUERY_KEY);
    if (current === serialized) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set(SIMULATION_URL_QUERY_KEY, serialized);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [
    pathname,
    router,
    searchParams,
    userData,
    settings.simulationSpeed,
    settings.selectedTestStatistic,
    settings.totalSimulations,
    settings.pValueType,
    plot.thresholdDirection,
    plot.thresholdInput,
  ]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      syncToUrl();
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [syncToUrl]);

  return null;
}
