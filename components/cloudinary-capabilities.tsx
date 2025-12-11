// components/cloudinary-capabilities.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Zap, Image, Scissors, Palette, Shield, Tag, Gauge } from "lucide-react";

export function CloudinaryCapabilities() {
  const capabilities = [
    {
      icon: <Scissors className="h-5 w-5" />,
      title: "Crop/Resize/Format",
      description: "Built-in URL transformations (w_, h_, c_, q_auto, f_auto)",
      status: "Available"
    },
    {
      icon: <Palette className="h-5 w-5" />,
      title: "Background Removal",
      description: "AI Background Removal add-on (transparent/replace background)",
      status: "Add-on"
    },
    {
      icon: <Gauge className="h-5 w-5" />,
      title: "Image Details & Metadata",
      description: "Upload response + Admin API (EXIF, colors, diagnostics)",
      status: "Available"
    },
    {
      icon: <Tag className="h-5 w-5" />,
      title: "AI Product Recognition",
      description: "Imagga/Google auto-tagging + product tooling",
      status: "Add-on"
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: "AI Image Validation",
      description: "Quality analysis, blur detection, framing validation",
      status: "Add-on"
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: "Automated Editing at Scale",
      description: "Eager transformations + automation rules",
      status: "Available"
    }
  ];

  return (
    <div className="space-y-4">
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-6 w-6" />
            Everything in Cloudinary!
          </CardTitle>
          <CardDescription className="text-green-600">
            All your e-commerce image processing needs can be handled by Cloudinary
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {capabilities.map((cap, index) => (
          <Card key={index} className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {cap.icon}
                  <CardTitle className="text-base">{cap.title}</CardTitle>
                </div>
                <Badge 
                  variant={cap.status === "Available" ? "default" : "secondary"}
                  className={cap.status === "Available" ? "bg-green-100 text-green-800" : ""}
                >
                  {cap.status}
                </Badge>
              </div>
              <CardDescription className="text-sm">
                {cap.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                {cap.status === "Available" ? (
                  <span className="text-green-600">✓ Ready to use with your current setup</span>
                ) : (
                  <span className="text-amber-600">Requires add-on activation</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}