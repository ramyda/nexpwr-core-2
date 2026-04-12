"use client";

import React, { useCallback, useState, useId } from "react";
import { UploadCloud, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  onImageSelected: (file: File) => void;
  label?: string;
  subtext?: string;
  accept?: string;
}

export function ImageUpload({ 
  onImageSelected, 
  label = "Click to upload or drag and drop",
  subtext = "TIFF, JPG, or PNG (High Resolution Orthomosaic)",
  accept = "image/jpeg, image/png, image/tiff, .tiff, .tif"
}: ImageUploadProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputId = useId();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsHovering(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsHovering(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsHovering(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        setSelectedFile(file);
        onImageSelected(file);
      }
    },
    [onImageSelected]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        setSelectedFile(file);
        onImageSelected(file);
      }
    },
    [onImageSelected]
  );

  if (selectedFile) {
    return (
      <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-2 overflow-hidden">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <div className="flex flex-col truncate">
            <span className="text-[13px] font-semibold truncate">{selectedFile.name}</span>
            <span className="text-[11px] opacity-70">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
          </div>
        </div>
        <button 
          onClick={() => { setSelectedFile(null); }}
          className="p-1.5 hover:bg-emerald-100 rounded-md transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center w-full min-h-[140px] border-1.5 border-dashed rounded-lg transition-all duration-200 group bg-white",
        isHovering
          ? "border-emerald-500 bg-emerald-50/20"
          : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        id={inputId}
        type="file"
        className="hidden"
        accept={accept}
        onChange={handleFileChange}
      />
      <label
        htmlFor={inputId}
        className="flex flex-col items-center justify-center w-full h-full cursor-pointer py-6"
      >
        <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
          <UploadCloud className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600" />
        </div>
        <p className="mb-0.5 text-[13px] text-zinc-600 font-medium">
          {label}
        </p>
        <p className="text-[11px] text-zinc-400">
          {subtext}
        </p>
      </label>
    </div>
  );
}

