"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Calendar, Activity, ArrowRight, ScanLine } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ClientSitesPage() {
  const [sites, setSites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/client/sites")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSites(data);
        } else if (data.error) {
          setError(data.error);
        } else {
          setError("Malformed data received from server.");
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch sites:", err);
        setError("Network error occurred while fetching sites.");
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <span className="text-xs text-zinc-500 font-mono uppercase tracking-widest">Loading Portfolio...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center text-center bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900/50 rounded-2xl p-8 shadow-sm">
        <h2 className="text-xl font-bold text-red-500 mb-2">Error Loading Sites</h2>
        <p className="text-zinc-500 dark:text-zinc-400 max-w-md mb-6">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline" className="border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300">
          Try Again
        </Button>
      </div>
    );
  }

  if (!Array.isArray(sites) || sites.length === 0) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center text-center bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl">
        <h2 className="text-xl font-bold text-zinc-400 dark:text-zinc-300 mb-2">No Sites Found</h2>
        <p className="text-zinc-500 max-w-md">Your organization doesn't have any registered solar assets yet. Contact your NexPwr administrator.</p>
      </div>
    );
  }
  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col gap-1 mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Portfolio Sites</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Manage and monitor your specific solar assets.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sites.map((site: any) => (
          <Card key={site.id} className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden group hover:border-indigo-500/50 transition-all duration-300 translate-y-0 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center mb-6 pt-4">
                <div className={`w-16 h-16 rounded-2xl ${site.color} flex items-center justify-center mb-4 shadow-xl ring-4 ring-white dark:ring-black/40 group-hover:scale-105 transition-transform duration-300`}>
                   <span className="text-2xl font-bold text-white tracking-wider">{site.initial}</span>
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 truncate w-full tracking-tight">{site.name}</h3>
                <div className="flex items-center text-zinc-400 dark:text-zinc-500 text-sm mt-2">
                  <MapPin className="w-3.5 h-3.5 mr-1" />
                  <span className="truncate font-medium">{site.location}</span>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500 font-bold text-[11px] uppercase tracking-wider flex items-center"><Calendar className="w-3.5 h-3.5 mr-1.5" /> COD</span>
                  <span className="text-zinc-900 dark:text-zinc-300 font-bold">{site.cod}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500 font-bold text-[11px] uppercase tracking-wider flex items-center"><ScanLine className="w-3.5 h-3.5 mr-1.5" /> Inspected</span>
                  <span className="text-zinc-900 dark:text-zinc-300 font-bold">{site.lastInspection}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-0 flex border-t border-zinc-100 dark:border-zinc-800">
              <Link href={`/client/sites/${site.id}`} className="w-1/2">
                <Button variant="ghost" className="w-full h-12 rounded-none border-r border-zinc-100 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-zinc-50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 font-bold tracking-tight text-xs uppercase">
                  <Activity className="w-4 h-4 mr-2" />
                  Details
                </Button>
              </Link>
              <Link href={`/client/map?site=${site.id}`} className="w-1/2">
                <Button variant="ghost" className="w-full h-12 rounded-none text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 font-bold tracking-tight text-xs uppercase">
                  Anomalies
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
