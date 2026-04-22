"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Users,
  MapPin,
  Activity,
  ClipboardList,
  FileText,
  X,
} from "lucide-react";

interface SearchResults {
  clients: { id: string; name: string; company: string; isActive: boolean; _count: { thermographySites: number; sites: number } }[];
  sites: { id: string; name: string; address: string | null; clientId: string | null; client: { name: string } | null }[];
  thermographyInspections: { id: string; name: string; inspectionYear: number; siteId: string; site: { name: string; id: string } }[];
  audits: { id: string; name: string; status: string; totalModulesInspected: number; site: { name: string; clientId: string | null } | null }[];
  inspections: { id: string; date: string; status: string; siteId: string; site: { name: string }; client: { name: string; id: string } | null }[];
}

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>(undefined);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query || query.length < 2) {
      setResults(null);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
        setIsOpen(true);
      } catch {
        setResults(null);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const navigate = (path: string) => {
    setIsOpen(false);
    setQuery("");
    router.push(path);
  };

  const hasResults =
    results &&
    (results.clients.length > 0 ||
      results.sites.length > 0 ||
      results.thermographyInspections.length > 0 ||
      results.audits.length > 0 ||
      results.inspections.length > 0);

  return (
    <div ref={containerRef} className="relative px-4 mb-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search clients, sites, inspections..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full pl-8 pr-8 py-1.5 bg-zinc-900 border border-zinc-800 rounded-md text-[12px] text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-600 transition-all"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setResults(null); setIsOpen(false); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-zinc-500 hover:text-zinc-300"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute left-4 right-4 top-full mt-1 bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl z-50 max-h-[400px] overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="p-4 text-center">
              <div className="w-4 h-4 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin mx-auto" />
            </div>
          ) : !hasResults ? (
            <div className="p-4 text-center text-zinc-500 text-[12px]">
              No results found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <div className="py-1">
              {/* Clients */}
              {results!.clients.length > 0 && (
                <ResultGroup title="Clients">
                  {results!.clients.map((c) => (
                    <ResultItem
                      key={c.id}
                      icon={<Users className="w-3.5 h-3.5" />}
                      primary={c.name}
                      secondary={`${c.company} · ${c._count.sites + c._count.thermographySites} sites`}
                      onClick={() => navigate(`/admin/clients/${c.id}`)}
                    />
                  ))}
                </ResultGroup>
              )}

              {/* Thermography Sites */}
              {results!.sites.length > 0 && (
                <ResultGroup title="Sites">
                  {results!.sites.map((s) => (
                    <ResultItem
                      key={s.id}
                      icon={<MapPin className="w-3.5 h-3.5" />}
                      primary={s.name}
                      secondary={s.client?.name || s.address || "No client linked"}
                      onClick={() => navigate(`/admin/thermography/sites/${s.id}`)}
                    />
                  ))}
                </ResultGroup>
              )}

              {/* Thermography Inspections */}
              {results!.thermographyInspections.length > 0 && (
                <ResultGroup title="Thermography Inspections">
                  {results!.thermographyInspections.map((i) => (
                    <ResultItem
                      key={i.id}
                      icon={<Activity className="w-3.5 h-3.5" />}
                      primary={i.name}
                      secondary={`${i.site.name} · ${i.inspectionYear}`}
                      onClick={() => navigate(`/admin/thermography/sites/${i.siteId}`)}
                    />
                  ))}
                </ResultGroup>
              )}

              {/* Audits */}
              {results!.audits.length > 0 && (
                <ResultGroup title="Audits">
                  {results!.audits.map((a) => (
                    <ResultItem
                      key={a.id}
                      icon={<ClipboardList className="w-3.5 h-3.5" />}
                      primary={a.name}
                      secondary={`${a.site?.name || "Unknown"} · ${a.status.replace("_", " ")}`}
                      onClick={() => navigate(`/admin/thermography/audits`)}
                    />
                  ))}
                </ResultGroup>
              )}

              {/* Existing Inspections */}
              {results!.inspections.length > 0 && (
                <ResultGroup title="Inspections">
                  {results!.inspections.map((i) => (
                    <ResultItem
                      key={i.id}
                      icon={<FileText className="w-3.5 h-3.5" />}
                      primary={i.site.name}
                      secondary={`${i.client?.name || "Unknown"} · ${i.status}`}
                      onClick={() => navigate(`/admin/inspections`)}
                    />
                  ))}
                </ResultGroup>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResultGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
        {title}
      </div>
      {children}
    </div>
  );
}

function ResultItem({
  icon,
  primary,
  secondary,
  onClick,
}: {
  icon: React.ReactNode;
  primary: string;
  secondary: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-zinc-900 transition-colors text-left"
    >
      <div className="text-zinc-500 flex-shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-[12px] font-medium text-zinc-200 truncate">{primary}</div>
        <div className="text-[10px] text-zinc-500 truncate">{secondary}</div>
      </div>
    </button>
  );
}
