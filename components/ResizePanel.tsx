// ResizePanel.tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function ResizePanel({
  imageUrl,
  onResized,
}: {
  imageUrl: string | null;
  onResized: (url: string) => void;
}) {
  const [width, setWidth] = useState(400);
  const [height, setHeight] = useState(300);

  if (!imageUrl || (!imageUrl.includes("/upload/") && !imageUrl.includes("/fetch/"))) {
    return <p className="text-sm text-muted-foreground">Please crop or upload to Cloudinary first.</p>;
  }

  const getResizedUrl = () => {
    if (imageUrl.includes("/upload/")) {
      return imageUrl.replace(
        "/upload/",
        `/upload/w_${width},h_${height},c_fill,f_auto,q_auto/`
      );
    }
    if (imageUrl.includes("/fetch/")) {
      return imageUrl.replace(
        "/fetch/",
        `/fetch/w_${width},h_${height},c_fill,f_auto,q_auto/`
      );
    }
    return imageUrl;
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="number"
          value={width}
          min={1}
          onChange={(e) => setWidth(Number(e.target.value))}
          className="border rounded px-2 py-1 w-24"
          placeholder="Width"
        />
        <input
          type="number"
          value={height}
          min={1}
          onChange={(e) => setHeight(Number(e.target.value))}
          className="border rounded px-2 py-1 w-24"
          placeholder="Height"
        />
        <Button onClick={() => onResized(getResizedUrl())}>Resize</Button>
      </div>
      <img
        src={getResizedUrl()}
        alt="Preview"
        className="max-h-48 rounded border"
      />
    </div>
  );
}