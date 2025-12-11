// components/cloudinary-validation-panel.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Image, Scissors, Zap, Shield } from "lucide-react";

interface CloudinaryValidationPanelProps {
  onValidate: (operations: any) => void;
  disabled?: boolean;
}

export function CloudinaryValidationPanel({ onValidate, disabled }: CloudinaryValidationPanelProps) {
  const [options, setOptions] = useState({
    // Basic operations
    resize: true,
    crop: true,
    optimize: true,
    convertFormat: true,
    
    // AI operations (requires add-ons)
    backgroundRemoval: false,
    qualityAnalysis: false,
    autoTagging: false,
    
    // Output
    targetFormat: "webp",
    targetWidth: 1200,
    targetHeight: 1200,
    quality: 85
  });

  const handleOptionChange = (key: string, value: any) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const buildOperations = () => {
    const operations: any = {};

    if (options.resize || options.crop) {
      operations.resize = {
        width: options.targetWidth,
        height: options.targetHeight,
        crop: options.crop ? "fill" : "fit"
      };
    }

    if (options.optimize) {
      operations.quality = options.quality;
    }

    if (options.convertFormat) {
      operations.format = options.targetFormat;
    }

    if (options.backgroundRemoval) {
      operations.background = "remove";
    }

    if (options.qualityAnalysis) {
      operations.analyze = true;
    }

    return operations;
  };

  const handleValidate = () => {
    const operations = buildOperations();
    onValidate({ operations });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Cloudinary E-commerce Validation
          </CardTitle>
          <CardDescription>
            Full e-commerce image processing using Cloudinary only
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic Operations */}
            <div className="space-y-3">
              <h4 className="font-medium">Basic Operations</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="resize"
                    checked={options.resize}
                    onCheckedChange={(checked) => handleOptionChange("resize", checked)}
                  />
                  <Label htmlFor="resize">Resize to standard dimensions</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="crop"
                    checked={options.crop}
                    onCheckedChange={(checked) => handleOptionChange("crop", checked)}
                  />
                  <Label htmlFor="crop">Smart crop for e-commerce</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="optimize"
                    checked={options.optimize}
                    onCheckedChange={(checked) => handleOptionChange("optimize", checked)}
                  />
                  <Label htmlFor="optimize">Optimize for web</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="convertFormat"
                    checked={options.convertFormat}
                    onCheckedChange={(checked) => handleOptionChange("convertFormat", checked)}
                  />
                  <Label htmlFor="convertFormat">Convert to WebP format</Label>
                </div>
              </div>
            </div>

            {/* AI Operations (Add-ons) */}
            <div className="space-y-3">
              <h4 className="font-medium">AI Operations (Add-ons)</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="backgroundRemoval"
                    checked={options.backgroundRemoval}
                    onCheckedChange={(checked) => handleOptionChange("backgroundRemoval", checked)}
                  />
                  <Label htmlFor="backgroundRemoval" className="flex items-center gap-2">
                    AI Background Removal
                    <Badge variant="outline" className="text-xs">Add-on</Badge>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="qualityAnalysis"
                    checked={options.qualityAnalysis}
                    onCheckedChange={(checked) => handleOptionChange("qualityAnalysis", checked)}
                  />
                  <Label htmlFor="qualityAnalysis" className="flex items-center gap-2">
                    Quality Analysis & Validation
                    <Badge variant="outline" className="text-xs">Add-on</Badge>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="autoTagging"
                    checked={options.autoTagging}
                    onCheckedChange={(checked) => handleOptionChange("autoTagging", checked)}
                  />
                  <Label htmlFor="autoTagging" className="flex items-center gap-2">
                    AI Auto-tagging
                    <Badge variant="outline" className="text-xs">Add-on</Badge>
                  </Label>
                </div>
              </div>
            </div>
          </div>

          {/* Output Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Output Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="width">Width</Label>
                  <input
                    type="number"
                    id="width"
                    value={options.targetWidth}
                    onChange={(e) => handleOptionChange("targetWidth", parseInt(e.target.value))}
                    className="w-full p-2 border rounded"
                    min="100"
                    max="4000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Height</Label>
                  <input
                    type="number"
                    id="height"
                    value={options.targetHeight}
                    onChange={(e) => handleOptionChange("targetHeight", parseInt(e.target.value))}
                    className="w-full p-2 border rounded"
                    min="100"
                    max="4000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quality">Quality (%)</Label>
                  <input
                    type="number"
                    id="quality"
                    value={options.quality}
                    onChange={(e) => handleOptionChange("quality", parseInt(e.target.value))}
                    className="w-full p-2 border rounded"
                    min="1"
                    max="100"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button 
            onClick={handleValidate} 
            className="w-full"
            disabled={disabled}
          >
            <Shield className="mr-2 h-5 w-5" />
            Run Cloudinary E-commerce Processing
          </Button>

          <div className="rounded-lg bg-blue-50 p-3 border border-blue-200">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-700">Benefits:</p>
                <ul className="text-blue-600 list-disc pl-4 space-y-1 mt-1">
                  <li>Single platform for all image processing</li>
                  <li>No API integration issues (already working!)</li>
                  <li>Cost-effective with your current plan</li>
                  <li>Built-in CDN and optimization</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}