import { create } from 'zustand';

interface MapFilterState {
  anomalyNames: string[];
  severities: string[];
  categories: string[];
  statuses: string[];
  iecClasses: string[];
}

interface ClientStore {
  selectedSiteId: string | null;
  setSelectedSiteId: (id: string | null) => void;
  
  // Map specific state
  mapFilters: MapFilterState;
  setMapFilters: (filters: Partial<MapFilterState>) => void;
  hoveredAnomalyId: string | null;
  setHoveredAnomalyId: (id: string | null) => void;
  selectedAnomalyId: string | null;
  setSelectedAnomalyId: (id: string | null) => void;
}

export const useClientStore = create<ClientStore>((set) => ({
  selectedSiteId: null,
  setSelectedSiteId: (id) => set({ selectedSiteId: id }),
  
  mapFilters: {
    anomalyNames: [],
    severities: [],
    categories: [],
    statuses: [],
    iecClasses: [],
  },
  setMapFilters: (filters) => 
    set((state) => ({ 
      mapFilters: { ...state.mapFilters, ...filters } 
    })),
    
  hoveredAnomalyId: null,
  setHoveredAnomalyId: (id) => set({ hoveredAnomalyId: id }),
  
  selectedAnomalyId: null,
  setSelectedAnomalyId: (id) => set({ selectedAnomalyId: id }),
}));
