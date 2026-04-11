"use client";

import React, { useCallback, useState } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  onImageSelected: (file: File) => void;
}

export function ImageUpload({ onImageSelected }: ImageUploadProps) {
  const [isHovering, setIsHovering] = useState(false);

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
        // Ensure it's an image
        if (file.type.startsWith("image/") || file.name.toLowerCase().endsWith('.tiff') || file.name.toLowerCase().endsWith('.tif')) {
          onImageSelected(file);
        } else {
          alert("Please upload a valid image file (JPG, PNG, TIFF).");
        }
      }
    },
    [onImageSelected]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        onImageSelected(e.target.files[0]);
      }
    },
    [onImageSelected]
  );

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center w-full h-[50vh] border-2 border-dashed rounded-xl transition-colors pb-8",
        isHovering
          ? "border-emerald-500 bg-emerald-50/10"
          : "border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800/50"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center pt-5 pb-6">
        <UploadCloud className="w-12 h-12 mb-4 text-emerald-500" />
        <p className="mb-2 text-sm text-zinc-300">
          <span className="font-semibold text-emerald-400">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-zinc-500">
          TIFF, JPG, or PNG (High Resolution Orthomosaic)
        </p>
      </div>
      <input
        id="dropzone-file"
        type="file"
        className="hidden"
        accept="image/jpeg, image/png, image/tiff, .tiff, .tif"
        onChange={handleFileChange}
      />
      <label
        htmlFor="dropzone-file"
        className="mt-4 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md cursor-pointer transition-colors font-medium text-sm"
      >
        Select Image
      </label>
    </div>
  );
}
