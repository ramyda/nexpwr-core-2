// ─────────────────────────────────────────────────────────────────────────────
// SOLAR PRODUCT CATALOG
// Module specs: powerW, tempCoeff (%/°C), noct (°C), technology
// ─────────────────────────────────────────────────────────────────────────────

export interface ModuleSpec {
  model: string;
  powerW: number;
  tempCoeff: number;  // %/°C e.g. -0.35
  noct: number;       // °C
  technology: string; // mono-PERC | mono-TOPCon | poly | HJT | IBC | thin-film
}

export const MODULE_CATALOG: Record<string, ModuleSpec[]> = {
  "Jinko Solar": [
    { model: "JKM400M-54HL4",   powerW: 400, tempCoeff: -0.35, noct: 44, technology: "mono-PERC" },
    { model: "JKM415N-54HL4",   powerW: 415, tempCoeff: -0.29, noct: 43, technology: "mono-TOPCon" },
    { model: "JKM430N-54HL4",   powerW: 430, tempCoeff: -0.29, noct: 43, technology: "mono-TOPCon" },
    { model: "JKM570N-72HL4",   powerW: 570, tempCoeff: -0.29, noct: 43, technology: "mono-TOPCon" },
  ],
  "LONGi Solar": [
    { model: "LR4-60HIH-355M",         powerW: 355, tempCoeff: -0.34, noct: 45, technology: "mono-PERC" },
    { model: "LR5-72HIH-540M",         powerW: 540, tempCoeff: -0.34, noct: 44, technology: "mono-PERC" },
    { model: "Hi-MO 6 LR5-54HTH-430M", powerW: 430, tempCoeff: -0.29, noct: 43, technology: "mono-TOPCon" },
  ],
  "Canadian Solar": [
    { model: "CS6R-400MS",       powerW: 400, tempCoeff: -0.35, noct: 44, technology: "mono-PERC" },
    { model: "CS6W-550MS",       powerW: 550, tempCoeff: -0.35, noct: 44, technology: "mono-PERC" },
    { model: "HiKu7 CS7N-655MS", powerW: 655, tempCoeff: -0.34, noct: 44, technology: "mono-PERC" },
  ],
  "Trina Solar": [
    { model: "TSM-400DE09.08",           powerW: 400, tempCoeff: -0.34, noct: 44, technology: "mono-PERC" },
    { model: "TSM-500DE18M",             powerW: 500, tempCoeff: -0.34, noct: 44, technology: "mono-PERC" },
    { model: "Vertex S TSM-415NEG9R.28", powerW: 415, tempCoeff: -0.30, noct: 44, technology: "mono-TOPCon" },
  ],
  "JA Solar": [
    { model: "JAM54S30-400MR", powerW: 400, tempCoeff: -0.35, noct: 45, technology: "mono-PERC" },
    { model: "JAM72S30-540MR", powerW: 540, tempCoeff: -0.35, noct: 44, technology: "mono-PERC" },
    { model: "JAM66D45-595LB", powerW: 595, tempCoeff: -0.30, noct: 44, technology: "mono-TOPCon" },
  ],
  "Risen Energy": [
    { model: "RSM40-8-400M",     powerW: 400, tempCoeff: -0.34, noct: 44, technology: "mono-PERC" },
    { model: "RSM150-8-500BMDG", powerW: 500, tempCoeff: -0.34, noct: 44, technology: "mono-PERC" },
    { model: "RSM110-8-540BMDG", powerW: 540, tempCoeff: -0.34, noct: 44, technology: "mono-PERC" },
  ],
  "First Solar": [
    { model: "Series 6 FS-6450", powerW: 450, tempCoeff: -0.28, noct: 44, technology: "thin-film" },
    { model: "Series 6 FS-6540", powerW: 540, tempCoeff: -0.28, noct: 44, technology: "thin-film" },
    { model: "Series 7 FS-7560", powerW: 560, tempCoeff: -0.28, noct: 44, technology: "thin-film" },
  ],
  "SunPower": [
    { model: "Maxeon 3 SPR-405E",    powerW: 405, tempCoeff: -0.27, noct: 44, technology: "IBC" },
    { model: "Maxeon 6 AC SPR-E-415", powerW: 415, tempCoeff: -0.27, noct: 44, technology: "IBC" },
    { model: "Performance 6 SPR-P6-500", powerW: 500, tempCoeff: -0.34, noct: 44, technology: "mono-PERC" },
  ],
  "Hanwha Q Cells": [
    { model: "Q.PEAK DUO ML-G10+ 400", powerW: 400, tempCoeff: -0.34, noct: 44, technology: "mono-PERC" },
    { model: "Q.PEAK DUO XL-G10.3 490", powerW: 490, tempCoeff: -0.34, noct: 44, technology: "mono-PERC" },
    { model: "Q.TRON M G2+ 420",        powerW: 420, tempCoeff: -0.34, noct: 43, technology: "mono-PERC" },
  ],
  "Vikram Solar": [
    { model: "ELDORA ULTRA 540", powerW: 540, tempCoeff: -0.35, noct: 44, technology: "mono-PERC" },
    { model: "SOMERA 400",       powerW: 400, tempCoeff: -0.35, noct: 44, technology: "mono-PERC" },
  ],
  "Waaree": [
    { model: "WS-440", powerW: 440, tempCoeff: -0.35, noct: 44, technology: "mono-PERC" },
    { model: "WS-540", powerW: 540, tempCoeff: -0.35, noct: 44, technology: "mono-PERC" },
    { model: "WS-600", powerW: 600, tempCoeff: -0.34, noct: 44, technology: "mono-PERC" },
  ],
  "Adani Solar": [
    { model: "ASM-72-P-340",   powerW: 340, tempCoeff: -0.40, noct: 45, technology: "poly" },
    { model: "ASM-144-M-540",  powerW: 540, tempCoeff: -0.35, noct: 44, technology: "mono-PERC" },
    { model: "AMOD-108-430Wp", powerW: 430, tempCoeff: -0.30, noct: 43, technology: "mono-TOPCon" },
  ],
  "REC Group": [
    { model: "REC370AA Alpha",  powerW: 370, tempCoeff: -0.34, noct: 44, technology: "mono-PERC" },
    { model: "REC400AA Alpha",  powerW: 400, tempCoeff: -0.34, noct: 44, technology: "mono-PERC" },
    { model: "REC440TP3 72/23", powerW: 440, tempCoeff: -0.34, noct: 44, technology: "mono-PERC" },
  ],
  "Panasonic": [
    { model: "EV-PVKH260",    powerW: 260, tempCoeff: -0.26, noct: 44, technology: "HJT" },
    { model: "EV-PVKH320",    powerW: 320, tempCoeff: -0.26, noct: 44, technology: "HJT" },
    { model: "EV-PVKH370ABD", powerW: 370, tempCoeff: -0.26, noct: 44, technology: "HJT" },
  ],
  "Sharp": [
    { model: "ND-R245A5",  powerW: 245, tempCoeff: -0.44, noct: 47, technology: "poly" },
    { model: "NU-JC300B5", powerW: 300, tempCoeff: -0.38, noct: 44, technology: "mono-PERC" },
    { model: "NU-JD400B5", powerW: 400, tempCoeff: -0.35, noct: 44, technology: "mono-PERC" },
  ],
};

export const MODULE_BRANDS = Object.keys(MODULE_CATALOG);

// ─────────────────────────────────────────────────────────────────────────────
// INVERTER CATALOG
// ─────────────────────────────────────────────────────────────────────────────
export const INVERTER_CATALOG: Record<string, string[]> = {
  "SMA":                 ["STP 25000TL", "STP 50000TL", "SHP 75-10", "Sunny Central 2200"],
  "Huawei":              ["SUN2000-5KTL", "SUN2000-100KTL", "SUN2000-185KTL"],
  "Sungrow":             ["SG5KTL", "SG110CX", "SG250HX", "SG3125HV"],
  "ABB/FIMER":           ["PVS-100-TL", "PVS-175-TL", "TRIO-50.0-TL"],
  "Fronius":             ["Symo 10.0-3", "Symo 24.0-3", "Eco 27.0-3"],
  "Growatt":             ["MAX 100KTL3 LV", "MAX 250KTL3 MV", "MID 25KTL3-X"],
  "Enphase":             ["IQ8H Microinverter", "IQ8M Microinverter", "IQ8A Microinverter"],
  "SolarEdge":           ["SE10K", "SE33.3K", "SE100K"],
  "Schneider Electric":  ["Conext TX 1000E", "Conext TL 25kW", "Conext Core XC 630"],
  "KACO":                ["blueplanet 125 TL3", "blueplanet 50 TL3", "Powador 300.0 TL3"],
  "Delta":               ["M80U 2000 G2", "M250 HV", "RPI M50A"],
  "Siemens":             ["SINACON PV 1500", "SINACON PV 630"],
  "GoodWe":              ["GW100K-MT", "GW250K-HT", "GW80KN-MT"],
};

export const INVERTER_BRANDS = Object.keys(INVERTER_CATALOG);

// ─────────────────────────────────────────────────────────────────────────────
// LOCATION SUGGESTIONS with GPS coordinates
// ─────────────────────────────────────────────────────────────────────────────
export const LOCATION_SUGGESTIONS = [
  { display: "Rajasthan, India",          lat: 27.0238,  lng: 74.2179 },
  { display: "Gujarat, India",            lat: 22.2587,  lng: 71.1924 },
  { display: "Tamil Nadu, India",         lat: 11.1271,  lng: 78.6569 },
  { display: "Andhra Pradesh, India",     lat: 15.9129,  lng: 79.7400 },
  { display: "Karnataka, India",          lat: 15.3173,  lng: 75.7139 },
  { display: "Madhya Pradesh, India",     lat: 22.9734,  lng: 78.6569 },
  { display: "Maharashtra, India",        lat: 19.7515,  lng: 75.7139 },
  { display: "Telangana, India",          lat: 17.1232,  lng: 79.2088 },
  { display: "Punjab, India",             lat: 31.1471,  lng: 75.3412 },
  { display: "Uttar Pradesh, India",      lat: 26.8467,  lng: 80.9462 },
  { display: "California, USA",           lat: 36.7783,  lng: -119.4179 },
  { display: "Texas, USA",               lat: 31.9686,  lng: -99.9018 },
  { display: "Arizona, USA",             lat: 34.0489,  lng: -111.0937 },
  { display: "Nevada, USA",              lat: 38.8026,  lng: -116.4194 },
  { display: "New Mexico, USA",          lat: 34.5199,  lng: -105.8701 },
  { display: "Saudi Arabia (Riyadh)",    lat: 24.6877,  lng: 46.7219 },
  { display: "UAE — Abu Dhabi",          lat: 24.2053,  lng: 54.3869 },
  { display: "Morocco — Ouarzazate",     lat: 30.9335,  lng: -6.9370 },
  { display: "Spain — Andalusia",        lat: 37.3891,  lng: -5.9845 },
  { display: "Germany — Bavaria",        lat: 48.7904,  lng: 11.4979 },
  { display: "Australia — Queensland",   lat: -20.9176, lng: 142.7028 },
  { display: "Chile — Atacama",          lat: -24.5000, lng: -69.2500 },
  { display: "Brazil — Bahia",           lat: -12.5797, lng: -41.7007 },
  { display: "China — Xinjiang",         lat: 42.1278,  lng: 87.1950 },
  { display: "Egypt — Aswan",            lat: 23.6845,  lng: 32.5498 },
  { display: "South Africa — Northern Cape", lat: -28.7282, lng: 21.0824 },
];

export const MODULE_TECH_OPTIONS = ["mono-PERC", "mono-TOPCon", "poly", "HJT", "IBC", "thin-film"];
