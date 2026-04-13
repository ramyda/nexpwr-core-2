"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface ActiveClient {
  id: string;
  name: string;
  company: string;
}

export interface ActiveSite {
  id: string;
  name: string;
  capacityMw: number;
}

export interface ActiveInspection {
  id: string;
  date: string;
  status: string;
}

interface ActiveClientContextType {
  activeClient: ActiveClient | null;
  activeSite: ActiveSite | null;
  activeInspection: ActiveInspection | null;
  setActiveClient: (client: ActiveClient | null) => void;
  setActiveSite: (site: ActiveSite | null) => void;
  setActiveInspection: (inspection: ActiveInspection | null) => void;
  clearContext: () => void;
  isLoading: boolean;
}

const ActiveClientContext = createContext<ActiveClientContextType | undefined>(undefined);

const STORAGE_KEY = "nexpwr_active_context";

export function ActiveClientProvider({ children }: { children: ReactNode }) {
  const [activeClient, setActiveClientState] = useState<ActiveClient | null>(null);
  const [activeSite, setActiveSiteState] = useState<ActiveSite | null>(null);
  const [activeInspection, setActiveInspectionState] = useState<ActiveInspection | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.activeClient) setActiveClientState(parsed.activeClient);
        if (parsed.activeSite) setActiveSiteState(parsed.activeSite);
        if (parsed.activeInspection) setActiveInspectionState(parsed.activeInspection);
      }
    } catch (error) {
      console.error("Failed to load active context from storage:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sync to localStorage
  useEffect(() => {
    if (isLoading) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ activeClient, activeSite, activeInspection })
      );
    } catch (error) {
      console.error("Failed to save active context to storage:", error);
    }
  }, [activeClient, activeSite, activeInspection, isLoading]);

  const setActiveClient = (client: ActiveClient | null) => {
    setActiveClientState(client);
    // When client changes, clear site and inspection
    if (!client || (activeClient && client.id !== activeClient.id)) {
      setActiveSiteState(null);
      setActiveInspectionState(null);
    }
  };

  const setActiveSite = (site: ActiveSite | null) => {
    setActiveSiteState(site);
    // When site changes, clear inspection
    if (!site || (activeSite && site.id !== activeSite.id)) {
      setActiveInspectionState(null);
    }
  };

  const setActiveInspection = (inspection: ActiveInspection | null) => {
    setActiveInspectionState(inspection);
  };

  const clearContext = () => {
    setActiveClientState(null);
    setActiveSiteState(null);
    setActiveInspectionState(null);
  };

  return (
    <ActiveClientContext.Provider
      value={{
        activeClient,
        activeSite,
        activeInspection,
        setActiveClient,
        setActiveSite,
        setActiveInspection,
        clearContext,
        isLoading,
      }}
    >
      {children}
    </ActiveClientContext.Provider>
  );
}

export function useActiveClient() {
  const context = useContext(ActiveClientContext);
  if (context === undefined) {
    throw new Error("useActiveClient must be used within an ActiveClientProvider");
  }
  return context;
}
