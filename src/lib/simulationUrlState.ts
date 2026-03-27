/**
 * Shareable app configuration in the URL (table, settings, plot threshold).
 * Simulation outputs are intentionally excluded — see HYDRATE_FROM_URL.
 * Link recipients can read the full dataset from the query string.
 *
 * Wire format: UTF-8 JSON → pako gzip (deflate) → base64url (no padding).
 * Schema v1 uses short keys to keep the JSON small before compression.
 */

import { gzip, ungzip } from "pako";
import type {
  UserDataState,
  Column,
  PValueType,
  HydrateFromUrlPayload,
  PlotThresholdDirection,
} from "@/contexts/SimulationContext/types";
import {
  validateSimulationSpeed,
  validateSelectedTestStatistic,
  validateTotalSimulations,
  validatePValueType,
  ensureUserDataRowIds,
  ensureColumnIds,
} from "@/contexts/SimulationContext/utils";
import { ExperimentalTestStatistic as StatEnum } from "@/contexts/SimulationContext/testStatistics";

export const SIMULATION_URL_QUERY_KEY = "d";

/** Wire schema version (short keys: ud, st, pl, …). */
export const SIMULATION_URL_SCHEMA_VERSION = 1 as const;

/** Skip writing the URL when the compressed payload would exceed this size. */
export const SIMULATION_URL_MAX_COMPRESSED_LENGTH = 7500;

function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlToUint8Array(b64url: string): Uint8Array | null {
  if (!b64url) return null;
  try {
    let b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4;
    if (pad) b64 += "=".repeat(4 - pad);
    const binary = atob(b64);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      out[i] = binary.charCodeAt(i);
    }
    return out;
  } catch {
    return null;
  }
}

function gzipUtf8JsonToBase64Url(json: string): string {
  const utf8 = new TextEncoder().encode(json);
  const gzipped = gzip(utf8, { level: 9 });
  return uint8ArrayToBase64Url(gzipped);
}

function ungzipBase64UrlToUtf8String(b64url: string): string | null {
  const bytes = base64UrlToUint8Array(b64url);
  if (!bytes) return null;
  try {
    const out = ungzip(bytes);
    return new TextDecoder().decode(out);
  } catch {
    return null;
  }
}

interface SettingsWire {
  simulationSpeed: number;
  selectedTestStatistic: string;
  totalSimulations: number;
  pValueType: PValueType;
}

function clampSettings(raw: SettingsWire): HydrateFromUrlPayload["settings"] {
  const speed = validateSimulationSpeed(raw.simulationSpeed)
    ? raw.simulationSpeed
    : 40;
  const stat = validateSelectedTestStatistic(
    raw.selectedTestStatistic as StatEnum
  )
    ? (raw.selectedTestStatistic as StatEnum)
    : StatEnum.DifferenceInMeans;
  const total = validateTotalSimulations(raw.totalSimulations)
    ? raw.totalSimulations
    : 1000;
  const pType = validatePValueType(raw.pValueType)
    ? raw.pValueType
    : ("two-tailed" as PValueType);
  return {
    simulationSpeed: speed,
    selectedTestStatistic: stat,
    totalSimulations: total,
    pValueType: pType,
  };
}

/** Plot: pl.td, pl.ti */
function normalizePlot(plot: unknown): HydrateFromUrlPayload["plot"] {
  if (!plot || typeof plot !== "object") {
    return { thresholdDirection: "geq", thresholdInput: "" };
  }
  const p = plot as Record<string, unknown>;
  const dir = p.td === "leq" || p.td === "geq" ? p.td : "geq";
  const ti = typeof p.ti === "string" ? p.ti : "";
  return { thresholdDirection: dir, thresholdInput: ti };
}

function parseRowWire(row: unknown) {
  if (!row || typeof row !== "object") {
    return {
      id: "",
      data: [] as (number | null)[],
      assignment: null as number | null,
      block: null as string | null,
      assignmentOriginalIndex: null as number | null,
    };
  }
  const r = row as Record<string, unknown>;
  const dataSrc = r.d;
  const data = Array.isArray(dataSrc)
    ? dataSrc.map((cell) =>
        cell === null || cell === undefined
          ? null
          : typeof cell === "number" && Number.isFinite(cell)
            ? cell
            : null
      )
    : [];
  const assignmentRaw = r.a;
  const assignment =
    assignmentRaw === null || assignmentRaw === undefined
      ? null
      : typeof assignmentRaw === "number" && Number.isFinite(assignmentRaw)
        ? Math.floor(assignmentRaw)
        : null;
  const blockRaw = r.b;
  const block =
    blockRaw === null || blockRaw === undefined
      ? null
      : String(blockRaw);
  const origRaw = r.o;
  const assignmentOriginalIndex =
    origRaw === null || origRaw === undefined
      ? null
      : typeof origRaw === "number" && Number.isFinite(origRaw)
        ? Math.floor(origRaw)
        : null;
  return {
    id: "",
    data,
    assignment,
    block,
    assignmentOriginalIndex,
  };
}

function parseColumnWire(col: unknown): Column {
  if (!col || typeof col !== "object") {
    return { id: "", name: "?", color: "text-gray-500" };
  }
  const c = col as Record<string, unknown>;
  const name = typeof c.n === "string" && c.n.length > 0 ? c.n : "?";
  const color =
    typeof c.c === "string" && c.c.length > 0 ? c.c : "text-gray-500";
  return { id: "", name, color };
}

function buildUserDataState(
  rowsRaw: unknown,
  columnsRaw: unknown,
  colorStack: string[],
  baselineColumn: number,
  blockingEnabled: boolean
): UserDataState | null {
  if (!Array.isArray(rowsRaw) || !Array.isArray(columnsRaw)) return null;

  const rows = rowsRaw.map((row) => parseRowWire(row));
  const columns = columnsRaw.map((col) => parseColumnWire(col));

  if (columns.length < 2) return null;

  const maxCol = columns.length - 1;
  const fixedRows = rows.map((row) => ({
    ...row,
    data: row.data.length >= columns.length
      ? row.data.slice(0, columns.length)
      : [...row.data, ...Array(columns.length - row.data.length).fill(null)],
    assignment:
      row.assignment !== null &&
      row.assignment >= 0 &&
      row.assignment <= maxCol
        ? row.assignment
        : null,
  }));

  const bc = baselineColumn <= maxCol ? baselineColumn : 0;

  let userData: UserDataState = {
    rows: fixedRows,
    columns,
    colorStack,
    baselineColumn: bc,
    blockingEnabled,
  };

  return ensureColumnIds(ensureUserDataRowIds(userData));
}

function parsePayload(o: Record<string, unknown>): HydrateFromUrlPayload | null {
  const ud = o.ud;
  if (!ud || typeof ud !== "object") return null;
  const userDataObj = ud as Record<string, unknown>;

  const rowsRaw = userDataObj.r;
  const columnsRaw = userDataObj.z;

  const colorStack = Array.isArray(userDataObj.cs)
    ? userDataObj.cs.filter((x): x is string => typeof x === "string")
    : [];

  const baselineColumn =
    typeof userDataObj.bc === "number" && Number.isFinite(userDataObj.bc)
      ? Math.max(0, Math.floor(userDataObj.bc))
      : 0;

  const blockingEnabled = userDataObj.be === true;

  const userData = buildUserDataState(
    rowsRaw,
    columnsRaw,
    colorStack,
    baselineColumn,
    blockingEnabled
  );
  if (!userData) return null;

  const st = o.st;
  if (!st || typeof st !== "object") return null;
  const s = st as Record<string, unknown>;
  const settings = clampSettings({
    simulationSpeed:
      typeof s.sp === "number" && Number.isFinite(s.sp) ? s.sp : 40,
    selectedTestStatistic:
      typeof s.ts === "string" ? s.ts : StatEnum.DifferenceInMeans,
    totalSimulations:
      typeof s.tn === "number" && Number.isFinite(s.tn) ? s.tn : 1000,
    pValueType:
      typeof s.pv === "string" ? (s.pv as PValueType) : "two-tailed",
  });

  const plot = normalizePlot(o.pl);

  return { userData, settings, plot };
}

export function parseSimulationUrlParam(
  compressed: string | null
): HydrateFromUrlPayload | null {
  if (!compressed || compressed.length === 0) return null;
  const json = ungzipBase64UrlToUtf8String(compressed);
  if (!json) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object") return null;
  const o = parsed as Record<string, unknown>;

  if (o.v !== SIMULATION_URL_SCHEMA_VERSION) return null;

  return parsePayload(o);
}

export function serializeSimulationUrlParam(input: {
  userData: UserDataState;
  settings: {
    simulationSpeed: number;
    selectedTestStatistic: StatEnum;
    totalSimulations: number;
    pValueType: PValueType;
  };
  plot: {
    thresholdDirection: PlotThresholdDirection;
    thresholdInput: string;
  };
}): string | null {
  const payload = {
    v: SIMULATION_URL_SCHEMA_VERSION,
    ud: {
      r: input.userData.rows.map((row) => ({
        d: row.data.map((c) => c),
        a: row.assignment,
        b: row.block,
        o: row.assignmentOriginalIndex,
      })),
      z: input.userData.columns.map((c) => ({
        n: c.name,
        c: c.color,
      })),
      cs: [...input.userData.colorStack],
      bc: input.userData.baselineColumn,
      be: input.userData.blockingEnabled,
    },
    st: {
      sp: input.settings.simulationSpeed,
      ts: input.settings.selectedTestStatistic,
      tn: input.settings.totalSimulations,
      pv: input.settings.pValueType,
    },
    pl: {
      td: input.plot.thresholdDirection,
      ti: input.plot.thresholdInput,
    },
  };

  let json: string;
  try {
    json = JSON.stringify(payload);
  } catch {
    return null;
  }

  const encoded = gzipUtf8JsonToBase64Url(json);
  if (encoded.length > SIMULATION_URL_MAX_COMPRESSED_LENGTH) {
    return null;
  }
  return encoded;
}
