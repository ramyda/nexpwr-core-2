"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Plus, MapPin, Zap, Calendar, AlertTriangle, FileText, 
  Map as MapIcon, Activity, ChevronRight, Pencil, 
  Trash2, ExternalLink, Download, ArrowRight,
  Droplets, Wind, Cloud, Sun, Thermometer,
  ChevronDown, Info, Globe, Target, Shield, DollarSign, Wrench,
  Box, CheckCircle, Loader
} from "lucide-react";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { SlideOver } from "@/components/shared/SlideOver";
import { ImageUpload } from "@/components/ImageUpload";
import { BackButton } from "@/components/shared/BackButton";
import { useToast } from "@/components/shared/Toast";
import dynamic from "next/dynamic";

const MapPicker = dynamic(() => import("@/components/MapPicker"), { 
  ssr: false,
  loading: () => <div className="h-[300px] w-full bg-zinc-100 animate-pulse rounded-lg flex items-center justify-center text-xs text-zinc-400">Loading Map...</div>
});

import { 
  MODULE_MANUFACTURERS, 
  MODULE_SPECS, 
  INVERTER_MANUFACTURERS 
} from "@/lib/constants/moduleLookup";

function FormSection({ 
  title, 
  children, 
  isOpen, 
  onToggle, 
  icon: Icon 
}: { 
  title: string; 
  children: React.ReactNode; 
  isOpen: boolean; 
  onToggle: () => void;
  icon?: any;
}) {
  return (
    <div className={`border-l-4 transition-all ${isOpen ? 'border-emerald-500 bg-white' : 'border-zinc-200 bg-zinc-50/30'}`}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-zinc-100/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-4 h-4 text-zinc-500" />}
          <span className="text-sm font-bold text-zinc-900 uppercase tracking-wider">{title}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="p-5 pt-2 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
          {children}
        </div>
      )}
    </div>
  );
}

function SearchableDropdown({ 
  label, 
  value, 
  options, 
  onSelect, 
  placeholder,
  required = false,
  tooltip
}: { 
  label: string; 
  value: string; 
  options: string[]; 
  onSelect: (val: string) => void;
  placeholder?: string;
  required?: boolean;
  tooltip?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-1.5 relative" ref={dropdownRef}>
      <label className="text-[13px] font-medium text-zinc-700 flex items-center gap-1.5">
        {label} {required && <span className="text-red-500">*</span>}
        {tooltip && (
          <div className="group relative">
            <Info className="w-3.5 h-3.5 text-zinc-400 cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-zinc-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              {tooltip}
            </div>
          </div>
        )}
      </label>
      <div 
        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-[13px] cursor-pointer flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={value ? "text-zinc-900" : "text-zinc-400"}>
          {value || placeholder || "Select..."}
        </span>
        <ChevronDown className="w-4 h-4 text-zinc-400" />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-1 bg-white border border-zinc-200 rounded-md shadow-xl z-[100] max-h-60 overflow-hidden flex flex-col">
          <input 
            autoFocus
            className="p-2 border-b border-zinc-100 text-sm outline-none bg-zinc-50"
            placeholder="Type to search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="overflow-auto custom-scrollbar">
            {filteredOptions.length === 0 && (
              <div 
                className="p-2 text-sm text-zinc-500 hover:bg-zinc-50 cursor-pointer italic"
                onClick={() => { onSelect(search); setIsOpen(false); }}
              >
                Use custom: "{search}"
              </div>
            )}
            {filteredOptions.map(opt => (
              <div 
                key={opt}
                className="px-3 py-2 text-sm text-zinc-700 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer transition-colors"
                onClick={() => { onSelect(opt); setIsOpen(false); setSearch(""); }}
              >
                {opt}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface Inspection {
  id: string;
  date: string;
  operator: string | null;
  droneModel: string | null;
  irradianceWm2: number | null;
  status: string;
  _count: { anomalies: number };
}

interface Anomaly {
  id: string;
  type: string;
  iecClass: string;
  deltaTC: number;
  locationString: string | null;
  status: string;
  priority: string | null;
  createdAt: string;
  inspection: { date: string };
}

interface Report {
  id: string;
  status: string;
  pdfUrl: string | null;
  inspection: { date: string; _count: { anomalies: number } };
  createdAt: string;
}

interface SiteDetail {
  id: string;
  name: string;
  location: string;
  capacityMw: number;
  modules: number | null;
  inverter: string | null;
  mountType: string | null;
  ppaRate: number | null;
  performanceRatio: number | null;
  moduleManufacturer?: string | null;
  moduleModel?: string | null;
  moduleStcPower: number | null;
  moduleTech: string | null;
  tempCoeffPmax: number | null;
  noct: number | null;
  modulesPerString: number | null;
  annualPoa: number | null;
  
  // New IEC fields
  latitude: number | null;
  longitude: number | null;
  commissioningDate: string | null;
  siteOwner: string | null;
  omContractor: string | null;
  gridConnectionType: string | null;
  currency: string;
  capacityAcMw: number | null;
  inverterCount: number | null;
  stringCount: number | null;
  combinerBoxCount: number | null;
  cellCount: number | null;
  moduleEfficiency: number | null;
  moduleLength: number | null;
  moduleWidth: number | null;
  moduleHeight: number | null;
  moduleWeight: number | null;
  tempCoeffIsc: number | null;
  tempCoeffVoc: number | null;
  bifacialityFactor: number | null;
  inverterManufacturer: string | null;
  inverterModel: string | null;
  inverterType: string | null;
  inverterRatedPowerAc: number | null;
  mpptCount: number | null;
  maxDcInputVoltage: number | null;
  mpptVoltageMin: number | null;
  mpptVoltageMax: number | null;
  ratedAcOutputVoltage: number | null;
  inverterEfficiency: number | null;
  communicationProtocol: string | null;
  tiltAngle: number | null;
  azimuthAngle: number | null;
  trackerMakeModel: string | null;
  rowSpacing: number | null;
  dcCableSection: number | null;
  acCableSection: number | null;
  earthingSystem: string | null;
  lightningProtection: boolean;
  surgeProtection: boolean;
  availabilityTarget: number | null;
  degradationRate: number | null;
  ppaTerm: number | null;
  fitRate: number | null;
  minIrradianceThermography: number;
  minDeltaTThreshold: number;
  cameraEmissivity: number;
  preInspectionRunDuration: number;
  thermalCameraModel: string | null;
  dronePlatform: string | null;

  client: { name: string; id: string };
  inspections: Inspection[];
  allAnomalies: Anomaly[];
  allReports: Report[];
}

export default function SiteDetailPage({ params }: { params: Promise<{ id: string, siteId: string }> }) {
  const { siteId } = React.use(params);
  const [site, setSite] = useState<SiteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("inspections");
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [isEditSlideOverOpen, setIsEditSlideOverOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, error } = useToast();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ "1": true });
  const [showMapPicker, setShowMapPicker] = useState(false);
  
  // Inspection SlideOver state
  const [uploadStep, setUploadStep] = useState(1);
  const [thermalFile, setThermalFile] = useState<File | null>(null);
  const [rgbFile, setRgbFile] = useState<File | null>(null);
  const [layoutFile, setLayoutFile] = useState<File | null>(null);
  
  // Form State for all IEC fields
  const [formState, setFormState] = useState<any>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/sites/${siteId}`);
      const data = await res.json();
      setSite(data);
    } catch (error) {
      console.error("Failed to fetch site data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [siteId]);

  useEffect(() => {
    if (site) {
      setFormState({
        ...site,
        capacityMWp: (site.capacityMw || 0) * 1000,
        // Ensure numbers are handled
        availabilityTarget: site.availabilityTarget || 0.80,
        degradationRate: site.degradationRate || 0.5,
      });
    }
  }, [site]);

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const updateField = (name: string, value: any) => {
    setFormState((prev: any) => ({ ...prev, [name]: value }));
  };

  // Calculations
  const calculatedValues = React.useMemo(() => {
    if (!formState) return { dcAcRatio: 0, generation: 0, revenue: 0 };
    
    const dcKwp = parseFloat(formState.capacityMWp) || 0;
    const acKw = parseFloat(formState.capacityAcMw) * 1000 || 0;
    const poa = parseFloat(formState.annualPoa) || 0;
    const pr = parseFloat(formState.performanceRatio) || 0.80;
    const ppa = parseFloat(formState.ppaRate) || 0;

    const dcAcRatio = acKw > 0 ? (dcKwp / acKw).toFixed(2) : 0;
    const generation = (dcKwp * poa * pr / 1000).toFixed(2);
    const revenue = (parseFloat(generation) * 1000 * ppa).toFixed(2);
    const revenue5Yr = (parseFloat(revenue) * 5).toFixed(2);

    return { dcAcRatio, generation, revenue, revenue5Yr };
  }, [formState]);

  // Compliance Check Logic
  const compliance = React.useMemo(() => {
    if (!formState) return { iec62446: false, iec61215: false, iec61724: false };
    
    const iec62446 = !!(formState.name && formState.location && formState.capacityMWp && formState.modules && formState.modulesPerString && formState.moduleStcPower);
    const iec61215 = !!(formState.moduleManufacturer && formState.moduleModel && formState.moduleTech && formState.tempCoeffPmax && formState.noct);
    const iec61724 = !!(formState.annualPoa && formState.performanceRatio && formState.availabilityTarget);

    return { iec62446, iec61215, iec61724 };
  }, [formState]);


  const handleEditSite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Preparation
    const payload = { ...formState };
    payload.capacityMw = (parseFloat(payload.capacityMWp) || 0) / 1000;
    delete payload.capacityMWp;
    delete payload.client;
    delete payload.inspections;
    delete payload.allAnomalies;
    delete payload.allReports;

    // Convert types
    Object.keys(payload).forEach(key => {
      const val = payload[key];
      if (typeof val === 'string' && !isNaN(val as any) && val !== '') {
         // Some strings should stay strings like 'id'
         if (!['id', 'name', 'location', 'moduleManufacturer', 'moduleModel', 'inverterManufacturer', 'inverterModel', 'operator', 'thermalCameraModel'].includes(key)) {
            payload[key] = parseFloat(val);
         }
      }
    });

    try {
      const res = await fetch(`/api/sites/${siteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsEditSlideOverOpen(false);
        success("Site updated successfully — IEC Compliance Verified");
        fetchData();
      } else {
        error("Failed to update site");
      }
    } catch (err) {
      console.error("Failed to update site:", err);
      error("Failed to update site");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateInspection = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Real implementation would handle multipart upload 
    // For now we simulate creation
    setTimeout(() => {
      setIsSlideOverOpen(false);
      setUploadStep(1);
      fetchData();
      setIsSubmitting(false);
    }, 1500);
  };

  if (loading) return <div className="p-8 text-center text-zinc-500">Loading site details...</div>;
  if (!site) return <div className="p-8 text-center text-red-500">Site not found</div>;

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 leading-none">{site.name}</h1>
          <Breadcrumb items={[
            { label: "Clients", href: "/admin/clients" }, 
            { label: site.client.name, href: `/admin/clients/${site.client.id}/sites` },
            { label: site.name }
          ]} />
        </div>
        <button 
          onClick={() => setIsEditSlideOverOpen(true)}
          className="bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-50 px-4 py-2 rounded-md text-[13px] font-medium transition-colors flex items-center gap-2"
        >
          <Pencil className="w-4 h-4" /> Edit Site
        </button>
      </div>

      {/* Site Info Card */}
      <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          <div className="space-y-4">
             <div>
               <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">Plant Capacity</span>
               <p className="text-[15px] font-semibold text-zinc-900">{site.capacityMw} MW DC</p>
             </div>
             <div>
               <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">Total Modules</span>
               <p className="text-[14px] font-medium text-zinc-800">{site.modules?.toLocaleString() || "---"}</p>
             </div>
          </div>
          <div className="space-y-4">
             <div>
               <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">Location</span>
               <p className="text-[14px] font-medium text-zinc-800">{site.location}</p>
             </div>
             <div>
               <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">Mount Type</span>
               <p className="text-[14px] font-medium text-zinc-800">{site.mountType || "---"}</p>
             </div>
          </div>
          <div className="space-y-4">
             <div>
               <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">Inverter Type</span>
               <p className="text-[14px] font-medium text-zinc-800">{site.inverter || "---"}</p>
             </div>
             <div>
               <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">PPA Rate</span>
               <p className="text-[14px] font-medium text-zinc-800">${site.ppaRate || "---"} / kWh</p>
             </div>
          </div>
          <div className="space-y-4">
             <div>
               <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">Performance Ratio</span>
               <p className="text-[14px] font-medium text-zinc-800">{(site.performanceRatio || 0.8) * 100}%</p>
             </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-200">
        <nav className="flex gap-8 -mb-px">
          {[
            { id: "inspections", label: "Inspections", icon: Activity },
            { id: "anomalies", label: "Anomalies", icon: AlertTriangle },
            { id: "reports", label: "Reports", icon: FileText },
            { id: "map", label: "Map", icon: MapIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id 
                  ? "border-emerald-600 text-emerald-700" 
                  : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.id === "inspections" && site.inspections.length > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 text-[10px]">{site.inspections.length}</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="py-2">
        {activeTab === "inspections" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900">Recent Audits</h3>
              <button 
                onClick={() => { setIsSlideOverOpen(true); setUploadStep(1); }}
                className="bg-zinc-900 text-white hover:bg-zinc-800 px-4 py-2 rounded-md text-[13px] font-medium transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> New Inspection
              </button>
            </div>
            
            <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-zinc-50 border-b border-zinc-100">
                  <tr>
                    <th className="px-6 py-3 text-[11px] font-bold text-zinc-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-zinc-500 uppercase">Operator</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-zinc-500 uppercase">Drone</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-zinc-500 uppercase">Irradiance</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-zinc-500 uppercase text-center">Anomalies</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-zinc-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-zinc-500 uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {site.inspections.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-zinc-500">No inspections found for this site.</td></tr>
                  ) : (
                    site.inspections.map((insp) => (
                      <tr key={insp.id} className="hover:bg-zinc-50 cursor-pointer" onClick={() => window.location.href = `/admin/inspections/${insp.id}`}>
                        <td className="px-6 py-4 text-[13px] font-medium text-zinc-900">{new Date(insp.date).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-[13px] text-zinc-600">{insp.operator || "---"}</td>
                        <td className="px-6 py-4 text-[13px] text-zinc-600">{insp.droneModel || "---"}</td>
                        <td className="px-6 py-4 text-[13px] text-zinc-600">{insp.irradianceWm2 ? insp.irradianceWm2 + " W/m²" : "---"}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 text-[11px] font-bold">{insp._count.anomalies}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            insp.status === 'COMPLETE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            insp.status === 'PUBLISHED' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                            'bg-zinc-100 text-zinc-500 border border-zinc-200'
                          }`}>
                            {insp.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                           <div className="flex items-center justify-end gap-2">
                             <Link href={`/admin/inspections/${insp.id}`} className="p-1.5 text-zinc-400 hover:text-emerald-600" title="Open Annotator"><Activity className="w-4 h-4" /></Link>
                             <button className="p-1.5 text-zinc-400 hover:text-zinc-900"><Download className="w-4 h-4" /></button>
                             <button className="p-1.5 text-zinc-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                           </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "anomalies" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white border border-zinc-200 p-4 rounded-lg">
                <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">Total</span>
                <p className="text-xl font-bold text-zinc-900">{site.allAnomalies.length}</p>
              </div>
              <div className="bg-white border border-zinc-200 p-4 rounded-lg">
                <span className="text-[11px] text-red-400 font-bold uppercase tracking-wider">C4</span>
                <p className="text-xl font-bold text-red-600">{site.allAnomalies.filter(a => a.iecClass === 'C4').length}</p>
              </div>
              <div className="bg-white border border-zinc-200 p-4 rounded-lg">
                <span className="text-[11px] text-orange-400 font-bold uppercase tracking-wider">C3</span>
                <p className="text-xl font-bold text-orange-600">{site.allAnomalies.filter(a => a.iecClass === 'C3').length}</p>
              </div>
              <div className="bg-white border border-zinc-200 p-4 rounded-lg">
                <span className="text-[11px] text-yellow-500 font-bold uppercase tracking-wider">C2</span>
                <p className="text-xl font-bold text-yellow-600">{site.allAnomalies.filter(a => a.iecClass === 'C2').length}</p>
              </div>
              <div className="bg-white border border-zinc-200 p-4 rounded-lg">
                <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">C1</span>
                <p className="text-xl font-bold text-zinc-600">{site.allAnomalies.filter(a => a.iecClass === 'C1').length}</p>
              </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-zinc-50 border-b border-zinc-100">
                  <tr>
                    <th className="px-6 py-3 text-[11px] font-bold text-zinc-500 uppercase">#ID</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-zinc-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-zinc-500 uppercase">IEC Class</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-zinc-500 uppercase">ΔT (°C)</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-zinc-500 uppercase">Location</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-zinc-500 uppercase">Inspection Date</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-zinc-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-zinc-500 uppercase">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 italic">
                  {site.allAnomalies.length === 0 ? (
                    <tr><td colSpan={8} className="px-6 py-12 text-center text-zinc-400 not-italic">No anomalies found.</td></tr>
                  ) : (
                    site.allAnomalies.map((a) => (
                      <tr key={a.id} className="hover:bg-zinc-50/50 transition-colors not-italic">
                        <td className="px-6 py-4 text-[13px] font-mono text-zinc-900 leading-none">{a.id.substring(0, 8)}</td>
                        <td className="px-6 py-4 text-[13px] text-zinc-700">{a.type}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold shadow-sm ${
                            a.iecClass === 'C4' ? 'bg-red-600 text-white' :
                            a.iecClass === 'C3' ? 'bg-orange-500 text-white' :
                            'bg-zinc-100 text-zinc-700 border border-zinc-200'
                          }`}>{a.iecClass}</span>
                        </td>
                        <td className="px-6 py-4 text-[13px] text-zinc-600">{a.deltaTC}°C</td>
                        <td className="px-6 py-4 text-[13px] text-zinc-600 truncate max-w-[150px]">{a.locationString || "---"}</td>
                        <td className="px-6 py-4 text-[13px] text-zinc-600">{new Date(a.inspection.date).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-[13px] text-zinc-600 uppercase font-semibold text-[10px] tracking-widest">{a.status}</td>
                        <td className="px-6 py-4 text-[13px] text-zinc-600 font-bold uppercase text-[10px]">{a.priority || "MEDIUM"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "reports" && (
           <div className="space-y-4">
             <div className="flex items-center justify-between">
               <h3 className="text-lg font-semibold text-zinc-900">Generated Reports</h3>
               <button className="bg-emerald-600 text-white hover:bg-emerald-700 px-4 py-2 rounded-md text-[13px] font-medium transition-colors">
                 Generate New Report
               </button>
             </div>
             <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
               <table className="w-full text-left border-collapse">
                 <thead className="bg-zinc-50 border-b border-zinc-100">
                   <tr>
                     <th className="px-6 py-3 text-[11px] font-bold text-zinc-500 uppercase">Date</th>
                     <th className="px-6 py-3 text-[11px] font-bold text-zinc-500 uppercase">Inspection</th>
                     <th className="px-6 py-3 text-[11px] font-bold text-zinc-500 uppercase text-center">Anomalies</th>
                     <th className="px-6 py-3 text-[11px] font-bold text-zinc-500 uppercase">DC Loss %</th>
                     <th className="px-6 py-3 text-[11px] font-bold text-zinc-500 uppercase">Status</th>
                     <th className="px-6 py-3 text-[11px] font-bold text-zinc-500 uppercase text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-zinc-100">
                    {site.allReports.length === 0 ? (
                      <tr><td colSpan={6} className="px-6 py-12 text-center text-zinc-400">No reports generated yet.</td></tr>
                    ) : (
                      site.allReports.map((r) => (
                        <tr key={r.id} className="hover:bg-zinc-50">
                          <td className="px-6 py-4 text-[13px] text-zinc-900 font-medium">{new Date(r.createdAt).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-[13px] text-zinc-600">{new Date(r.inspection.date).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-center text-[13px] text-zinc-600">{r.inspection._count.anomalies}</td>
                          <td className="px-6 py-4 text-[13px] text-zinc-600">0.45%</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider border border-emerald-100">READY</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <div className="flex items-center justify-end gap-2">
                               <button className="p-1.5 text-zinc-400 hover:text-zinc-900" title="Download PDF"><FileText className="w-4 h-4" /></button>
                               <button className="p-1.5 text-zinc-400 hover:text-zinc-900" title="Download CSV"><Download className="w-4 h-4" /></button>
                               <button className="p-1.5 text-zinc-400 hover:text-zinc-900" title="Download KML"><MapIcon className="w-4 h-4" /></button>
                             </div>
                          </td>
                        </tr>
                      ))
                    )}
                 </tbody>
               </table>
             </div>
           </div>
        )}

        {activeTab === "map" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-zinc-900">Site Location Mapping</h3>
            <div className="h-[500px] bg-zinc-100 rounded-xl flex items-center justify-center border border-zinc-200 overflow-hidden relative shadow-inner">
               <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/-115.1728,36.1147,15,0/1200x500?access_token=pk.eyJ1IjoiZGV2LWVsdHlydXMiLCJhIjoiY2x4b3RqaHR4MDAxODJxbzF4aGg0OHY3eSJ9')] bg-cover opacity-50 grayscale contrast-125" />
               <div className="z-10 bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-2xl border border-white flex flex-col items-center">
                 <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center mb-3 shadow-lg shadow-emerald-600/30">
                   <MapPin className="w-6 h-6 text-white" />
                 </div>
                 <p className="text-[14px] font-bold text-zinc-900">Map Interface Offline</p>
                 <p className="text-[12px] text-zinc-500 max-w-[200px] text-center mt-1">Satellite imagery for {site.location} requires an active Mapbox/Leaflet provider.</p>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* New Inspection SlideOver */}
      <SlideOver 
        isOpen={isSlideOverOpen} 
        onClose={() => { setIsSlideOverOpen(false); setUploadStep(1); }} 
        title="Add New Inspection"
      >
        {uploadStep === 1 ? (
          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-zinc-900">Step 1: Upload Aerial Data</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[12px] font-bold text-zinc-500 uppercase tracking-tight">Thermal Orthomosaic (GeoTIFF) *</label>
                <div className="border-1.5 border-dashed border-zinc-200 rounded-lg p-8 text-center bg-white hover:border-zinc-300 transition-colors">
                  {thermalFile ? (
                    <div className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-100 rounded text-emerald-700">
                      <span className="text-[13px] font-medium truncate max-w-[200px]">{thermalFile.name}</span>
                      <button onClick={() => setThermalFile(null)} className="p-1 hover:bg-emerald-100 rounded text-emerald-900"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-3">
                         <MapIcon className="w-5 h-5 text-zinc-400" />
                      </div>
                      <p className="text-[13px] text-zinc-600 mb-1 font-medium">Radiometric TIFF or TIF</p>
                      <p className="text-[11px] text-zinc-400 mb-4">Required mapping file</p>
                      <label className="cursor-pointer bg-zinc-900 text-white px-4 py-1.5 rounded text-[12px] font-medium hover:bg-zinc-800">
                         Select File
                         <input type="file" className="hidden" accept=".tif,.tiff" onChange={(e) => setThermalFile(e.target.files?.[0] || null)} />
                      </label>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[12px] font-bold text-zinc-500 uppercase tracking-tight">RGB Visual Orthomosaic *</label>
                <div className="border-1.5 border-dashed border-zinc-200 rounded-lg p-8 text-center bg-white hover:border-zinc-300 transition-colors">
                  {rgbFile ? (
                    <div className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-100 rounded text-emerald-700">
                      <span className="text-[13px] font-medium truncate max-w-[200px]">{rgbFile.name}</span>
                      <button onClick={() => setRgbFile(null)} className="p-1 hover:bg-emerald-100 rounded text-emerald-900"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-3">
                         <Sun className="w-5 h-5 text-zinc-400" />
                      </div>
                      <p className="text-[13px] text-zinc-600 mb-1 font-medium">TIFF, JPG or PNG</p>
                      <p className="text-[11px] text-zinc-400 mb-4">Visual reference mapping</p>
                      <label className="cursor-pointer bg-zinc-100 text-zinc-900 border border-zinc-200 px-4 py-1.5 rounded text-[12px] font-medium hover:bg-zinc-200">
                         Select File
                         <input type="file" className="hidden" accept=".tif,.tiff,.jpg,.jpeg,.png" onChange={(e) => setRgbFile(e.target.files?.[0] || null)} />
                      </label>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[12px] font-bold text-zinc-500 uppercase tracking-tight">Plant Layout (PDF) — Optional</label>
                <div className="border border-zinc-100 rounded-lg p-4 bg-zinc-50/50">
                   {layoutFile ? (
                     <div className="flex items-center justify-between text-[12px] text-zinc-700">
                       <span className="truncate">{layoutFile.name}</span>
                       <button onClick={() => setLayoutFile(null)} className="text-zinc-400 hover:text-zinc-900"><X className="w-3.5 h-3.5" /></button>
                     </div>
                   ) : (
                     <label className="flex items-center justify-center gap-2 cursor-pointer text-[12px] font-medium text-zinc-500">
                       <Plus className="w-3 h-3" /> Select PDF
                       <input type="file" className="hidden" accept=".pdf" onChange={(e) => setLayoutFile(e.target.files?.[0] || null)} />
                     </label>
                   )}
                </div>
              </div>
            </div>

            <button 
              disabled={!thermalFile || !rgbFile}
              onClick={() => setUploadStep(2)}
              className="w-full bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-40 py-3 rounded-md text-[14px] font-semibold flex items-center justify-center gap-2 transition-all mt-8"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleCreateInspection} className="space-y-5 animate-in slide-in-from-right-4 duration-300">
            <h3 className="text-sm font-semibold text-zinc-900">Step 2: Inspection Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[12px] text-zinc-500 font-medium">Inspection Date</label>
                <input type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded text-[13px]" />
              </div>
              <div className="space-y-1">
                <label className="text-[12px] text-zinc-500 font-medium">Operator Name</label>
                <input type="text" placeholder="e.g. Skyline Aero" className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded text-[13px]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[12px] text-zinc-500 font-medium">Drone / Platform</label>
                <input type="text" placeholder="e.g. Matrice 350" className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded text-[13px]" />
              </div>
              <div className="space-y-1">
                <label className="text-[12px] text-zinc-500 font-medium">Thermal Sensor</label>
                <input type="text" placeholder="e.g. Zenmuse H20T" className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded text-[13px]" />
              </div>
            </div>

            {/* IEC Compliance Strip */}
            <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100 flex gap-2 flex-wrap">
               <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100">
                 <Sun className="w-3 h-3" /> Irradiance ≥ 600 W/m²
               </span>
               <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100">
                 <Wind className="w-3 h-3" /> Wind ≤ 3 m/s
               </span>
               <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-200/50 text-zinc-500 text-[10px] font-bold border border-zinc-200">
                 <Thermometer className="w-3 h-3" /> Delta T ≥ 3°C
               </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[12px] text-zinc-500 font-medium">Irradiance (W/m²)</label>
                <input name="irradianceWm2" type="number" defaultValue={850} className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded text-[13px]" />
              </div>
              <div className="space-y-1">
                <label className="text-[12px] text-zinc-500 font-medium">Ambient Temp (°C)</label>
                <input name="ambientTempC" type="number" defaultValue={25} className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded text-[13px]" />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-6">
              <button 
                type="button" 
                onClick={() => setUploadStep(1)}
                className="flex-1 px-4 py-2 border border-zinc-200 text-zinc-700 rounded-md text-[13px] font-medium hover:bg-zinc-50"
              >
                Back
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 px-4 py-2 rounded-md text-[13px] font-bold shadow-lg shadow-emerald-600/20"
              >
                {isSubmitting ? "Processing..." : "Create Inspection"}
              </button>
            </div>
          </form>
        )}
      </SlideOver>

      {/* Edit Site SlideOver */}
      <SlideOver
        isOpen={isEditSlideOverOpen}
        onClose={() => setIsEditSlideOverOpen(false)}
        title="Edit Site Details"
      >
        <form onSubmit={handleEditSite} className="space-y-4 pb-20 pt-2">
          {!formState ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-3">
               <Loader className="w-6 h-6 animate-spin" />
               <span className="text-sm">Initializing IEC workflow...</span>
            </div>
          ) : (
            <div className="space-y-1">
              {/* SECTION 1: SITE IDENTIFICATION */}
              <FormSection 
                title="1. Site Identification" 
                isOpen={openSections["1"]} 
                onToggle={() => toggleSection("1")}
                icon={Globe}
              >
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-zinc-700">Site Name *</label>
                    <input 
                      value={formState.name} 
                      onChange={(e) => updateField("name", e.target.value)}
                      required 
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] outline-none focus:ring-1 focus:ring-emerald-500" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-zinc-700">Location / Address *</label>
                    <input 
                      value={formState.location} 
                      onChange={(e) => updateField("location", e.target.value)}
                      required 
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] outline-none focus:ring-1 focus:ring-emerald-500" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-zinc-700">Latitude</label>
                      <input 
                        type="number" step="0.000001"
                        value={formState.latitude || ""} 
                        onChange={(e) => updateField("latitude", e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] outline-none focus:ring-1 focus:ring-emerald-500" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-zinc-700">Longitude</label>
                      <input 
                        type="number" step="0.000001"
                        value={formState.longitude || ""} 
                        onChange={(e) => updateField("longitude", e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] outline-none focus:ring-1 focus:ring-emerald-500" 
                      />
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setShowMapPicker(!showMapPicker)}
                    className={`flex items-center gap-2 text-[12px] font-bold transition-colors w-fit ${showMapPicker ? 'text-zinc-600' : 'text-emerald-600 hover:text-emerald-700'}`}
                  >
                    <MapIcon className="w-3.5 h-3.5" /> {showMapPicker ? "- Hide Map Picker" : "[📍 Get from map]"}
                  </button>

                  {showMapPicker && (
                    <div className="animate-in fade-in zoom-in-95 duration-200">
                      <MapPicker 
                        initialPos={formState.latitude && formState.longitude ? [formState.latitude, formState.longitude] : undefined}
                        onSelect={(lat, lng) => {
                          updateField("latitude", lat);
                          updateField("longitude", lng);
                        }}
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-zinc-700">Commissioning Date</label>
                      <input 
                        type="date"
                        value={formState.commissioningDate ? new Date(formState.commissioningDate).toISOString().split('T')[0] : ""} 
                        onChange={(e) => updateField("commissioningDate", e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] outline-none focus:ring-1 focus:ring-emerald-500" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-zinc-700">Grid Connection</label>
                      <select 
                        value={formState.gridConnectionType || ""} 
                        onChange={(e) => updateField("gridConnectionType", e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="">Select...</option>
                        <option value="On-Grid">On-Grid</option>
                        <option value="Off-Grid">Off-Grid</option>
                        <option value="Hybrid">Hybrid</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-zinc-700">Asset Owner</label>
                      <input 
                        value={formState.siteOwner || ""} 
                        onChange={(e) => updateField("siteOwner", e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] outline-none focus:ring-1 focus:ring-emerald-500" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-zinc-700">O&M Contractor</label>
                      <input 
                        value={formState.omContractor || ""} 
                        onChange={(e) => updateField("omContractor", e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] outline-none focus:ring-1 focus:ring-emerald-500" 
                      />
                    </div>
                  </div>
                </div>
              </FormSection>

              {/* SECTION 2: PLANT CAPACITY */}
              <FormSection 
                title="2. Plant Capacity (IEC 62446-3 §4)" 
                isOpen={openSections["2"]} 
                onToggle={() => toggleSection("2")}
                icon={Zap}
              >
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-zinc-700">Capacity DC (kWp) *</label>
                      <input 
                        type="number"
                        value={formState.capacityMWp || ""} 
                        onChange={(e) => updateField("capacityMWp", e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] outline-none focus:ring-1 focus:ring-emerald-500" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-zinc-700">Capacity AC (kW)</label>
                      <input 
                        type="number"
                        value={formState.capacityAcMw ? formState.capacityAcMw * 1000 : ""} 
                        onChange={(e) => updateField("capacityAcMw", parseFloat(e.target.value)/1000)}
                        className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] outline-none focus:ring-1 focus:ring-emerald-500" 
                      />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-zinc-700">Number of Inverters</label>
                      <input 
                        type="number"
                        value={formState.inverterCount || ""} 
                        onChange={(e) => updateField("inverterCount", e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] outline-none focus:ring-1 focus:ring-emerald-500" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-zinc-700">Total Modules *</label>
                      <input 
                        type="number"
                        value={formState.modules || ""} 
                        onChange={(e) => updateField("modules", e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] outline-none focus:ring-1 focus:ring-emerald-500" 
                      />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-zinc-700">Number of Strings</label>
                      <input 
                        type="number"
                        value={formState.stringCount || ""} 
                        onChange={(e) => updateField("stringCount", e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] outline-none focus:ring-1 focus:ring-emerald-500" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-zinc-700">Modules Per String *</label>
                      <input 
                        type="number"
                        value={formState.modulesPerString || ""} 
                        onChange={(e) => updateField("modulesPerString", e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] outline-none focus:ring-1 focus:ring-emerald-500" 
                      />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-zinc-700">DC:AC Ratio</label>
                      <div className="w-full px-3 py-2 bg-zinc-100 border border-zinc-200 rounded-md text-[13px] font-bold text-zinc-600 flex items-center justify-between">
                         {calculatedValues.dcAcRatio}
                         <span className="text-[10px] bg-zinc-200 px-1 rounded uppercase tracking-wider">Auto</span>
                      </div>
                    </div>
                 </div>
              </FormSection>

              {/* SECTION 3: MODULE SPECIFICATIONS */}
              <FormSection 
                title="3. Module Specifications (IEC 61215)" 
                isOpen={openSections["3"]} 
                onToggle={() => toggleSection("3")}
                icon={Box}
              >
                  <SearchableDropdown 
                    label="Module Manufacturer"
                    value={formState.moduleManufacturer || ""}
                    options={MODULE_MANUFACTURERS}
                    onSelect={(val) => updateField("moduleManufacturer", val)}
                    required
                  />

                  <SearchableDropdown 
                    label="Module Model"
                    value={formState.moduleModel || ""}
                    options={MODULE_SPECS.filter(s => s.manufacturer === formState.moduleManufacturer).map(s => s.model)}
                    onSelect={(val) => {
                      updateField("moduleModel", val);
                      // Auto-populate
                      const spec = MODULE_SPECS.find(s => s.model === val);
                      if (spec) {
                        setFormState((prev: any) => ({
                          ...prev,
                          moduleModel: val,
                          moduleStcPower: spec.stcPower,
                          moduleTech: spec.technology,
                          tempCoeffPmax: spec.tempCoeffPmax,
                          noct: spec.noct,
                          moduleLength: parseFloat(spec.dimensions.split('x')[0]),
                          moduleWidth: parseFloat(spec.dimensions.split('x')[1]),
                          moduleHeight: parseFloat(spec.dimensions.split('x')[2]),
                          cellCount: spec.cellCount,
                          moduleEfficiency: spec.efficiency,
                          autoFilled: true
                        }));
                        success(`Loaded specs for ${val}`);
                      }
                    }}
                    required
                  />

                  {formState.autoFilled && (
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded w-fit">
                      <CheckCircle className="w-3 h-3" /> Auto-filled from module database
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-zinc-700 flex items-center justify-between">
                        STC Power (Wp) *
                        <span className="text-[10px] text-zinc-400 font-normal">IEC 62446-3 §5.2</span>
                      </label>
                      <input 
                        type="number"
                        value={formState.moduleStcPower || ""} 
                        onChange={(e) => updateField("moduleStcPower", e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] outline-none focus:ring-1 focus:ring-emerald-500" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-zinc-700">Technology</label>
                      <select 
                        value={formState.moduleTech || ""} 
                        onChange={(e) => updateField("moduleTech", e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="Mono-PERC">Mono-PERC</option>
                        <option value="Mono TOPCON">Mono TOPCON</option>
                        <option value="Mono HJT">Mono HJT</option>
                        <option value="Bifacial PERC">Bifacial PERC</option>
                        <option value="Bifacial TOPCon">Bifacial TOPCon</option>
                        <option value="Poly">Poly</option>
                        <option value="Thin Film (CdTe)">Thin Film (CdTe)</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-zinc-700">Temp Coeff Pmax (%/°C) *</label>
                      <input 
                        type="number" step="0.001"
                        value={formState.tempCoeffPmax || ""} 
                        onChange={(e) => updateField("tempCoeffPmax", e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] outline-none focus:ring-1 focus:ring-emerald-500" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-zinc-700">NOCT (°C) *</label>
                      <input 
                        type="number"
                        value={formState.noct || ""} 
                        onChange={(e) => updateField("noct", e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] outline-none focus:ring-1 focus:ring-emerald-500" 
                      />
                    </div>
                  </div>
              </FormSection>

              {/* SECTION 4: INVERTER SPECIFICATIONS */}
              <FormSection 
                title="4. Inverter Specifications" 
                isOpen={openSections["4"]} 
                onToggle={() => toggleSection("4")}
                icon={Target}
              >
                  <SearchableDropdown 
                    label="Inverter Manufacturer"
                    value={formState.inverterManufacturer || ""}
                    options={INVERTER_MANUFACTURERS}
                    onSelect={(val) => updateField("inverterManufacturer", val)}
                  />
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-zinc-700">Inverter Model</label>
                    <input 
                      value={formState.inverterModel || ""} 
                      onChange={(e) => updateField("inverterModel", e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] outline-none focus:ring-1 focus:ring-emerald-500" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-zinc-700">Rated Power AC (kW)</label>
                      <input 
                        type="number"
                        value={formState.inverterRatedPowerAc || ""} 
                        onChange={(e) => updateField("inverterRatedPowerAc", e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] outline-none focus:ring-1 focus:ring-emerald-500" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-zinc-700">MPPT Inputs</label>
                      <input 
                        type="number"
                        value={formState.mpptCount || ""} 
                        onChange={(e) => updateField("mpptCount", e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] outline-none focus:ring-1 focus:ring-emerald-500" 
                      />
                    </div>
                  </div>
              </FormSection>

              {/* SECTION 5: MOUNTING & ELECTRICAL */}
              <FormSection 
                title="5. Mounting & Electrical" 
                isOpen={openSections["5"]} 
                onToggle={() => toggleSection("5")}
                icon={Shield}
              >
                 <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-zinc-700">Mount Type</label>
                    <select 
                      value={formState.mountType || "Fixed Tilt"} 
                      onChange={(e) => updateField("mountType", e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="Fixed Tilt">Fixed Tilt</option>
                      <option value="Single Axis Tracker (SAT)">Single Axis Tracker (SAT)</option>
                      <option value="Dual Axis Tracker">Dual Axis Tracker</option>
                      <option value="Rooftop Fixed">Rooftop Fixed</option>
                      <option value="Floating (FPV)">Floating (FPV)</option>
                    </select>
                 </div>
                 {formState.mountType === "Fixed Tilt" && (
                   <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1">
                      <div className="space-y-1.5">
                        <label className="text-[13px] font-medium text-zinc-700">Tilt Angle °</label>
                        <input 
                          type="number"
                          value={formState.tiltAngle || ""} 
                          onChange={(e) => updateField("tiltAngle", e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] outline-none focus:ring-1 focus:ring-emerald-500" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[13px] font-medium text-zinc-700">Azimuth Angle °</label>
                        <input 
                          type="number"
                          value={formState.azimuthAngle || ""} 
                          onChange={(e) => updateField("azimuthAngle", e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] outline-none focus:ring-1 focus:ring-emerald-500" 
                        />
                      </div>
                   </div>
                 )}
                 <div className="flex items-center gap-6 py-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formState.lightningProtection} 
                        onChange={(e) => updateField("lightningProtection", e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-zinc-300" 
                      />
                      <span className="text-[13px] font-medium text-zinc-700">Lightning Protection</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formState.surgeProtection} 
                        onChange={(e) => updateField("surgeProtection", e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-zinc-300" 
                      />
                      <span className="text-[13px] font-medium text-zinc-700">Surge Protection</span>
                    </label>
                 </div>
              </FormSection>

              {/* SECTION 6: PERFORMANCE & FINANCIAL */}
              <FormSection 
                title="6. Performance & Financial (IEC 61724-1)" 
                isOpen={openSections["6"]} 
                onToggle={() => toggleSection("6")}
                icon={DollarSign}
              >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-zinc-700 flex items-center gap-1.5">
                        Annual POA Irradiance
                        <div className="group relative">
                          <Info className="w-3.5 h-3.5 text-zinc-400 cursor-help" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-zinc-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                            Required for IEC 61724-1:2021 §5.6. Unit: kWh/m²/yr
                          </div>
                        </div>
                      </label>
                      <input 
                        type="number"
                        value={formState.annualPoa || ""} 
                        onChange={(e) => updateField("annualPoa", e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] outline-none focus:ring-1 focus:ring-emerald-500" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-zinc-700">Performance Ratio</label>
                      <input 
                        type="number" step="0.01"
                        value={formState.performanceRatio || 0.80} 
                        onChange={(e) => updateField("performanceRatio", e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] outline-none focus:ring-1 focus:ring-emerald-500" 
                      />
                    </div>
                  </div>
                  <div className="space-y-4 pt-2">
                    <div className="p-3 bg-zinc-50 rounded border border-zinc-100 space-y-3">
                       <div className="flex items-center justify-between text-[12px] text-zinc-500">
                         <span>Expected Generation (MWh/yr)</span>
                         <span className="font-bold text-zinc-900">{calculatedValues.generation} MWh</span>
                       </div>
                       <div className="flex items-center justify-between text-[12px] text-zinc-500">
                         <span>Estimated Annual Revenue</span>
                         <span className="font-bold text-zinc-900">{formState.currency} {calculatedValues.revenue}</span>
                       </div>
                       <div className="flex items-center justify-between text-[13px] font-bold text-emerald-700 pt-2 border-t border-zinc-200">
                         <span>5-Year Revenue Projection</span>
                         <span>{formState.currency} {calculatedValues.revenue5Yr}</span>
                       </div>
                    </div>
                  </div>
              </FormSection>

              {/* SECTION 7: INSPECTION PARAMETERS */}
              <FormSection 
                title="7. Inspection Parameters (IEC 62446-3)" 
                isOpen={openSections["7"]} 
                onToggle={() => toggleSection("7")}
                icon={Wrench}
              >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-zinc-700">Min Irradiance (W/m²)</label>
                      <input 
                        type="number"
                        value={formState.minIrradianceThermography || 600} 
                        onChange={(e) => updateField("minIrradianceThermography", e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] outline-none focus:ring-1 focus:ring-emerald-500" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-zinc-700">Min ΔT Threshold (°C)</label>
                      <input 
                        type="number"
                        value={formState.minDeltaTThreshold || 3} 
                        onChange={(e) => updateField("minDeltaTThreshold", e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] outline-none focus:ring-1 focus:ring-emerald-500" 
                      />
                    </div>
                  </div>
              </FormSection>

              {/* COMPLIANCE SUMMARY BAR */}
              <div className="fixed bottom-0 right-0 w-[440px] bg-white border-t border-zinc-200 p-4 px-6 z-50 flex flex-col gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                 <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                       <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Compliance Status</span>
                       <div className="flex gap-2">
                          <span className={`text-[11px] font-bold flex items-center gap-1 ${compliance.iec62446 ? 'text-emerald-600' : 'text-zinc-400'}`}>
                            {compliance.iec62446 ? '✓' : '⚠'} IEC 62446-3
                          </span>
                          <span className={`text-[11px] font-bold flex items-center gap-1 ${compliance.iec61215 ? 'text-emerald-600' : 'text-zinc-400'}`}>
                            {compliance.iec61215 ? '✓' : '⚠'} IEC 61215
                          </span>
                          <span className={`text-[11px] font-bold flex items-center gap-1 ${compliance.iec61724 ? 'text-emerald-600' : 'text-zinc-400'}`}>
                            {compliance.iec61724 ? '✓' : '⚠'} IEC 61724-1
                          </span>
                       </div>
                    </div>
                 </div>
                 
                 <div className="flex items-center gap-3">
                    <button 
                      type="button" 
                      onClick={() => setIsEditSlideOverOpen(false)} 
                      className="flex-1 px-4 py-2 border border-zinc-200 text-zinc-700 rounded-md text-[13px] font-medium hover:bg-zinc-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSubmitting} 
                      className="flex-1 bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-50 px-4 py-2 rounded-md text-[13px] font-bold transition-all shadow-lg shadow-black/10 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : "Save Changes"}
                    </button>
                 </div>
              </div>
            </div>
          )}
        </form>
      </SlideOver>
    </div>
  );
}

function X(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}
