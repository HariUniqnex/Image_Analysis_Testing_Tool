// components/claid-options.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Scissors, Palette, Maximize2, Sparkles } from "lucide-react";

interface ClaidOptions {
  // Quality & Enhancement
  enhance: boolean;
  enhanceStrength: number; // 0-1
  
  // Background options
  removeBackground: boolean;
  replaceBackground: boolean;
  backgroundColor: string;
  
  // Cropping options
  smartCrop: boolean;
  cropAspectRatio: string;
  addPadding: boolean;
  paddingSize: string;
  
  // Resizing options
  resize: boolean;
  targetWidth: number;
  targetHeight: number;
  
  // Format & Quality
  outputFormat: string;
  quality: number;
}

interface ClaidOptionsPanelProps {
  onProcess: (operations: any) => void;
  disabled?: boolean;
}

export function ClaidOptionsPanel({ onProcess, disabled }: ClaidOptionsPanelProps) {
  const [options, setOptions] = useState<ClaidOptions>({
    enhance: true,
    enhanceStrength: 0.3,
    removeBackground: true,
    replaceBackground: true,
    backgroundColor: "#ffffff",
    smartCrop: true,
    cropAspectRatio: "1:1",
    addPadding: true,
    paddingSize: "5%",
    resize: true,
    targetWidth: 1200,
    targetHeight: 1200,
    outputFormat: "webp",
    quality: 85,
  });

  const handleOptionChange = (key: keyof ClaidOptions, value: any) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const buildClaidOperations = () => {
    const operations: any = {};

    // Quality Enhancement
    if (options.enhance) {
      operations.adjustments = {
        hdr: { intensity: options.enhanceStrength, stitching: true },
        exposure: 0.1,
        saturation: 0.15,
        contrast: 0.1,
        sharpness: 0.2
      };
      operations.restorations = {
        polish: true,
        decompress: "moderate"
      };
    }

    // Background options
    if (options.removeBackground) {
      operations.background = {
        remove: {
          category: "products",
          selective: { object_to_keep: "product" },
          clipping: true
        }
      };
      
      if (options.replaceBackground) {
        operations.background.color = options.backgroundColor;
      }
    }

    // Cropping options
    if (options.smartCrop) {
      operations.resizing = {
        width: options.targetWidth,
        height: options.targetHeight,
        fit: { type: "crop", crop: "smart" }
      };
    } else if (options.resize) {
      operations.resizing = {
        width: options.targetWidth,
        height: options.targetHeight,
        fit: "bounds"
      };
    }

    // Padding
    if (options.addPadding) {
      operations.padding = options.paddingSize;
    }

    // Output format
    const outputFormat = options.outputFormat === "webp" ? {
      type: "webp",
      compression: {
        type: "lossy",
        quality: options.quality
      }
    } : options.outputFormat;

    return {
      operations,
      outputFormat
    };
  };

  const handleProcess = () => {
    const { operations, outputFormat } = buildClaidOperations();
    onProcess({ operations, output: { format: outputFormat } });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Quality & Enhancement
          </CardTitle>
          <CardDescription>Improve image quality and appearance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="enhance"
                checked={options.enhance}
                onCheckedChange={(checked) => handleOptionChange("enhance", checked)}
              />
              <Label htmlFor="enhance" className="font-medium">
                Auto-enhance
              </Label>
            </div>
          </div>
          {options.enhance && (
            <div className="pl-6 space-y-2">
              <Label htmlFor="strength">Enhancement Strength</Label>
              <Slider
                id="strength"
                min={0}
                max={1}
                step={0.1}
                value={[options.enhanceStrength]}
                onValueChange={([value]) => handleOptionChange("enhanceStrength", value)}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Subtle</span>
                <span>Strong</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Background Options
          </CardTitle>
          <CardDescription>Remove or replace background</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="removeBackground"
                checked={options.removeBackground}
                onCheckedChange={(checked) => handleOptionChange("removeBackground", checked)}
              />
              <Label htmlFor="removeBackground" className="font-medium">
                Remove Background
              </Label>
            </div>
          </div>
          
          {options.removeBackground && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="replaceBackground"
                    checked={options.replaceBackground}
                    onCheckedChange={(checked) => handleOptionChange("replaceBackground", checked)}
                  />
                  <Label htmlFor="replaceBackground" className="font-medium">
                    Replace with Solid Color
                  </Label>
                </div>
              </div>
              
              {options.replaceBackground && (
                <div className="pl-6 space-y-2">
                  <Label htmlFor="bgColor">Background Color</Label>
                  <div className="flex gap-2">
                    <div
                      className="w-8 h-8 rounded border"
                      style={{ backgroundColor: options.backgroundColor }}
                    />
                    <input
                      type="color"
                      id="bgColor"
                      value={options.backgroundColor}
                      onChange={(e) => handleOptionChange("backgroundColor", e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scissors className="h-5 w-5" />
            Cropping & Resizing
          </CardTitle>
          <CardDescription>Adjust image dimensions and composition</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="smartCrop"
                checked={options.smartCrop}
                onCheckedChange={(checked) => handleOptionChange("smartCrop", checked)}
              />
              <Label htmlFor="smartCrop" className="font-medium">
                Smart Crop
              </Label>
            </div>
          </div>
          
          {!options.smartCrop && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="resize"
                  checked={options.resize}
                  onCheckedChange={(checked) => handleOptionChange("resize", checked)}
                />
                <Label htmlFor="resize" className="font-medium">
                  Resize
                </Label>
              </div>
            </div>
          )}
          
          {(options.smartCrop || options.resize) && (
            <div className="grid grid-cols-2 gap-4 pl-6">
              <div className="space-y-2">
                <Label htmlFor="width">Target Width</Label>
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
                <Label htmlFor="height">Target Height</Label>
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
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="addPadding"
                checked={options.addPadding}
                onCheckedChange={(checked) => handleOptionChange("addPadding", checked)}
              />
              <Label htmlFor="addPadding" className="font-medium">
                Add Padding
              </Label>
            </div>
          </div>
          
          {options.addPadding && (
            <div className="pl-6 space-y-2">
              <Label htmlFor="paddingSize">Padding Size</Label>
              <Select
                value={options.paddingSize}
                onValueChange={(value) => handleOptionChange("paddingSize", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2%">Small (2%)</SelectItem>
                  <SelectItem value="5%">Medium (5%)</SelectItem>
                  <SelectItem value="10%">Large (10%)</SelectItem>
                  <SelectItem value="5% 25%">Custom (5% 25%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Maximize2 className="h-5 w-5" />
            Output Settings
          </CardTitle>
          <CardDescription>Final image format and quality</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="format">Output Format</Label>
              <Select
                value={options.outputFormat}
                onValueChange={(value) => handleOptionChange("outputFormat", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jpeg">JPEG</SelectItem>
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="webp">WebP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quality">Quality</Label>
              <Slider
                id="quality"
                min={10}
                max={100}
                step={5}
                value={[options.quality]}
                onValueChange={([value]) => handleOptionChange("quality", value)}
              />
              <div className="text-center text-sm">{options.quality}%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button 
        onClick={handleProcess} 
        className="w-full"
        disabled={disabled}
      >
        <CheckCircle className="mr-2 h-4 w-4" />
        Process with Selected Options
      </Button>
    </div>
  );
}