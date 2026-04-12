export interface ModuleSpec {
  manufacturer: string;
  model: string;
  stcPower: number;
  technology: string;
  tempCoeffPmax: number;
  noct: number;
  dimensions: string; // L x W x H
  cellCount: number;
  efficiency: number;
  tempCoeffIsc?: number;
  tempCoeffVoc?: number;
}

export const MODULE_MANUFACTURERS = [
  "Jinko Solar", "LONGi Solar", "Canadian Solar", "Trina Solar", 
  "JA Solar", "Risen Energy", "Astronergy", "Suntech", 
  "Waaree", "Adani Solar", "Vikram Solar", "REC Group", 
  "SunPower", "Q CELLS", "First Solar", "Tongwei", 
  "Seraphim", "Aiko Solar", "Hyundai Energy", "BYD Solar", 
  "Yingli Solar", "Sharp", "Panasonic", "Other"
];

export const MODULE_SPECS: ModuleSpec[] = [
  {
    manufacturer: "Jinko Solar",
    model: "Tiger Neo N-Type 78HL4-BDV",
    stcPower: 620,
    technology: "Bifacial TOPCon",
    tempCoeffPmax: -0.30,
    noct: 45,
    dimensions: "2465 x 1134 x 30",
    cellCount: 156,
    efficiency: 22.17
  },
  {
    manufacturer: "LONGi Solar",
    model: "Hi-MO 6 Explorer",
    stcPower: 585,
    technology: "Mono TOPCON",
    tempCoeffPmax: -0.29,
    noct: 45,
    dimensions: "2278 x 1134 x 30",
    cellCount: 144,
    efficiency: 22.6
  },
  {
    manufacturer: "Canadian Solar",
    model: "HiKu7 Mono PERC",
    stcPower: 670,
    technology: "Mono-PERC",
    tempCoeffPmax: -0.34,
    noct: 42,
    dimensions: "2384 x 1303 x 35",
    cellCount: 132,
    efficiency: 21.6
  },
  {
    manufacturer: "Trina Solar",
    model: "Vertex N 700W",
    stcPower: 700,
    technology: "Bifacial TOPCon",
    tempCoeffPmax: -0.30,
    noct: 43,
    dimensions: "2384 x 1303 x 33",
    cellCount: 132,
    efficiency: 22.5
  },
  {
    manufacturer: "JA Solar",
    model: "DeepBlue 4.0 Pro",
    stcPower: 630,
    technology: "Mono TOPCON",
    tempCoeffPmax: -0.30,
    noct: 45,
    dimensions: "2465 x 1134 x 30",
    cellCount: 156,
    efficiency: 22.5
  }
  // More specs would be added here in a real production environment
];

export const INVERTER_MANUFACTURERS = [
  "SMA", "Huawei", "Sungrow", "ABB", "Fronius", "Growatt",
  "Schneider Electric", "KACO", "Enphase", "SolarEdge",
  "Delta", "GoodWe", "Ginlong Solis", "Fimer", "Other"
];
