import { create } from "zustand";

// ---- Types ----
export interface DashboardKPIs {
  totalDcCapacityMw: number;
  totalAcCapacityMw: number;
  totalPowerLossKwp: number;
  totalRevenueLoss: number;
  siteCount: number;
  inspectionCount: number;
  totalAnomalyCount: number;
}

export interface AnomalySummaryItem {
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface AnomalySummary {
  total: number;
  severity: AnomalySummaryItem[];
  status:   AnomalySummaryItem[];
  iec:      AnomalySummaryItem[];
}

export interface InspectionRow {
  id: string;
  date: string;
  status: string;
  siteName: string;
  siteLocation: string;
  dcCapacityMw: number | null;
  acCapacityMw: number | null;
  totalPowerLossKwp: number | null;
  totalRevenueLoss: number | null;
  totalAnomalyCount: number | null;
  criticalCount: number | null;
  moderateCount: number | null;
  minorCount: number | null;
}

export interface AnomalyBreakdownItem {
  name: string;
  value: number;
  color: string;
}

export interface TrendDataItem {
  date: string;
  powerLoss: number;
  anomalies: number;
}

// ---- Store ----
interface DashboardStore {
  kpis: DashboardKPIs | null;
  anomalySummary: AnomalySummary | null;
  inspectionsList: { inspections: InspectionRow[]; total: number } | null;
  anomalyBreakdown: AnomalyBreakdownItem[];
  trendData: TrendDataItem[];

  isLoading: boolean;
  error: string | null;

  fetchAll: () => Promise<void>;
  fetchKpis: () => Promise<void>;
  fetchAnomalySummary: () => Promise<void>;
  fetchInspectionsList: (page?: number) => Promise<void>;
  fetchAnomalyBreakdown: () => Promise<void>;
  fetchTrendData: () => Promise<void>;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  kpis: null,
  anomalySummary: null,
  inspectionsList: null,
  anomalyBreakdown: [],
  trendData: [],
  isLoading: false,
  error: null,

  fetchAll: async () => {
    set({ isLoading: true, error: null });
    try {
      await Promise.all([
        useDashboardStore.getState().fetchKpis(),
        useDashboardStore.getState().fetchAnomalySummary(),
        useDashboardStore.getState().fetchInspectionsList(),
        useDashboardStore.getState().fetchAnomalyBreakdown(),
        useDashboardStore.getState().fetchTrendData(),
      ]);
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchKpis: async () => {
    const res = await fetch("/api/client/dashboard/kpis");
    if (res.ok) {
      const data = await res.json();
      set({ kpis: data });
    }
  },

  fetchAnomalySummary: async () => {
    const res = await fetch("/api/client/dashboard/anomalies-summary");
    if (res.ok) {
      const data = await res.json();
      set({ anomalySummary: data });
    }
  },

  fetchInspectionsList: async (page = 1) => {
    const res = await fetch(`/api/client/dashboard/inspections-list?page=${page}&pageSize=10`);
    if (res.ok) {
      const data = await res.json();
      set({ inspectionsList: data });
    }
  },

  fetchAnomalyBreakdown: async () => {
    const res = await fetch("/api/client/dashboard/anomalies-breakdown");
    if (res.ok) {
      const data = await res.json();
      set({ anomalyBreakdown: data.breakdown ?? [] });
    }
  },

  fetchTrendData: async () => {
    const res = await fetch("/api/client/dashboard/trend");
    if (res.ok) {
      const data = await res.json();
      set({ trendData: data });
    }
  },
}));
