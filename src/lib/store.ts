import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SeverityType } from "./constants";

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Anomaly {
  id: string;
  type: string;
  severity: SeverityType;           // Derived from ΔT per IEC 62446-3
  tempDeltaC: number | null;        // ΔT — MANDATORY for IEC classification
  modulesAffected: number;          // Integer, manual entry only (NEVER pixel-estimated)
  panelLocation: string;
  notes: string;
  box: BoundingBox;
  thumbnail: string;                // Thermal crop base64
  rgbThumbnail?: string;            // Optional RGB crop base64
  timestamp: string;
  lat?: number;
  lng?: number;
}

export interface PlantMetadata {
  name: string;
  locationText: string;
  lat?: number;
  lng?: number;
  capacityMw: number;
  modulesCount: number;
  moduleBrand: string;
  moduleModel: string;
  modulePowerW: number;             // Wp — STC rating
  modulesPerString: number;
  // IEC 61215 module specs (auto-filled from catalog)
  moduleTechnology: string;         // mono-PERC | mono-TOPCon | poly | HJT | IBC | thin-film
  tempCoeffPmax: number;            // %/°C e.g. -0.35
  noct: number;                     // °C e.g. 44
  inverterBrand: string;
  inverterModel: string;
  inverterPowerKw: number;
  mountType: string;
  geojson: any | null;
  layoutPdfBase64: string | null;
  layoutRefBase64: string | null; // For DWG or other reference types
  layoutFileName: string | null;
  layoutType: 'geojson' | 'pdf' | 'dwg' | 'shapefile' | null;
}

export interface InspectionMetadata {
  date: string;
  operator: string;
  droneModel: string;
  cameraModel: string;
  // Ambient weather
  weatherHumidity: number;          // %
  weatherTempC: number;             // Ambient °C
  weatherCloudCover: number;        // %
  windSpeedMs: number;              // m/s — IEC 62446-3 requires < 4 m/s
  // Financial
  ppaRate: number;                  // $/kWh
  annualPoaIrradiance: number;      // kWh/m²/year — for IEC 61724-1 annual projection
  performanceRatio: number;         // 0–1 dimensionless
  // IEC 62446-3 field inspection mandatory fields
  irradianceWm2: number;            // W/m² at time of inspection — MUST be ≥ 600
  moduleTempC: number;              // Module backsheet temp °C
  cameraEmissivity: number;         // default 0.85
  minTempDeltaThreshold: number;    // °C default 3
  activeTab: "setup" | "inspection" | "annotate" | "report";
}

interface AppState {
  plantMetadata: PlantMetadata;
  inspectionMetadata: InspectionMetadata;
  anomalies: Anomaly[];
  thermalImageFile: File | null;
  rgbImageFile: File | null;
  setPlantMetadata: (info: Partial<PlantMetadata>) => void;
  setInspectionMetadata: (info: Partial<InspectionMetadata>) => void;
  setThermalImageFile: (file: File | null) => void;
  setRgbImageFile: (file: File | null) => void;
  addAnomaly: (anomaly: Omit<Anomaly, "id" | "timestamp">) => void;
  updateAnomaly: (id: string, updates: Partial<Anomaly>) => void;
  deleteAnomaly: (id: string) => void;
  clearAnomalies: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      plantMetadata: {
        name: "",
        locationText: "",
        capacityMw: 0,
        modulesCount: 0,
        moduleBrand: "",
        moduleModel: "",
        modulePowerW: 0,
        modulesPerString: 0,
        moduleTechnology: "mono-PERC",
        tempCoeffPmax: -0.35,
        noct: 44,
        inverterBrand: "",
        inverterModel: "",
        inverterPowerKw: 0,
        mountType: "ground",
        geojson: null,
        layoutPdfBase64: null,
        layoutRefBase64: null,
        layoutFileName: null,
        layoutType: null,
      },
      inspectionMetadata: {
        date: new Date().toISOString().split("T")[0],
        operator: "",
        droneModel: "",
        cameraModel: "",
        weatherHumidity: 50,
        weatherTempC: 28,
        weatherCloudCover: 0,
        windSpeedMs: 2,
        ppaRate: 0.04,
        annualPoaIrradiance: 1600,
        performanceRatio: 0.80,
        irradianceWm2: 800,
        moduleTempC: 55,
        cameraEmissivity: 0.85,
        minTempDeltaThreshold: 3,
        activeTab: "setup",
      },
      anomalies: [],
      thermalImageFile: null,
      rgbImageFile: null,
      setPlantMetadata: (info) =>
        set((state) => ({ plantMetadata: { ...state.plantMetadata, ...info } })),
      setInspectionMetadata: (info) =>
        set((state) => ({ inspectionMetadata: { ...state.inspectionMetadata, ...info } })),
      setThermalImageFile: (thermalImageFile) => set({ thermalImageFile }),
      setRgbImageFile: (rgbImageFile) => set({ rgbImageFile }),
      addAnomaly: (anomaly) =>
        set((state) => ({
          anomalies: [
            ...state.anomalies,
            {
              ...anomaly,
              id: crypto.randomUUID(),
              timestamp: new Date().toISOString(),
            },
          ],
        })),
      updateAnomaly: (id, updates) =>
        set((state) => ({
          anomalies: state.anomalies.map((a) => (a.id === id ? { ...a, ...updates } : a)),
        })),
      deleteAnomaly: (id) =>
        set((state) => ({
          anomalies: state.anomalies.filter((a) => a.id !== id),
        })),
      clearAnomalies: () => set({ anomalies: [] }),
    }),
    {
      name: "solar-anomaly-raptor-v3",  // New key forces fresh state with new schema
      partialize: (state) => ({
        ...state,
        thermalImageFile: null,
        rgbImageFile: null,
      }),
    }
  )
);
