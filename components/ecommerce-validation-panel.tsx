// components/ecommerce-validation-panel.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Image, Scissors, Zap, Shield, TrendingUp } from "lucide-react";

interface ValidationOptions {
  // Validation Checks
  detectBlur: boolean;
  detectBackground: boolean;
  detectCropping: boolean;
  detectExposure: boolean;
  detectComposition: boolean;
  
  // Auto-Fixes
  autoFixBackground: boolean;
  autoFixCropping: boolean;
  autoEnhanceQuality: boolean;
  optimizeForWeb: boolean;
  
  // Output Settings
  standardizeFormat: boolean;
  targetFormat: string;
  standardizeSize: boolean;
  targetSize: string;
}

interface EcommerceValidationPanelProps {
  onValidate: (operations: any) => void;
  disabled?: boolean;
}

export function EcommerceValidationPanel({ onValidate, disabled }: EcommerceValidationPanelProps) {
  const [options, setOptions] = useState<ValidationOptions>({
    // Validation Checks (all enabled by default)
    detectBlur: true,
    detectBackground: true,
    detectCropping: true,
    detectExposure: true,
    detectComposition: true,
    
    // Auto-Fixes
    autoFixBackground: true,
    autoFixCropping: true,
    autoEnhanceQuality: true,
    optimizeForWeb: true,
    
    // Output Settings
    standardizeFormat: true,
    targetFormat: "webp",
    standardizeSize: true,
    targetSize: "1200x1200",
  });

  const handleOptionChange = (key: keyof ValidationOptions, value: any) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const getValidationOperations = () => {
    const operations: any = {
      restorations: {
        decompress: options.optimizeForWeb ? "moderate" : null,
        polish: options.autoEnhanceQuality
      }
    };

    // Background handling
    if (options.detectBackground || options.autoFixBackground) {
      operations.background = {
        remove: options.autoFixBackground ? {
          category: "products",
          selective: { object_to_keep: "product" },
          clipping: true
        } : false,
        color: options.autoFixBackground ? "#ffffff" : null
      };
    }

    // Cropping and resizing
    if (options.detectCropping || options.autoFixCropping) {
      if (options.standardizeSize || options.autoFixCropping) {
        const [width, height] = options.targetSize.split("x").map(Number);
        operations.resizing = {
          width: width,
          height: height,
          fit: options.autoFixCropping ? { type: "crop", crop: "smart" } : "bounds"
        };
      }
    }

    // Quality enhancement
    if (options.autoEnhanceQuality || options.detectExposure || options.detectBlur) {
      operations.adjustments = {
        hdr: options.autoEnhanceQuality ? { intensity: 0.3, stitching: true } : 0,
        exposure: 0,
        sharpness: options.detectBlur ? 0.2 : 0
      };
    }

    // Add padding for e-commerce
    if (options.autoFixCropping) {
      operations.padding = "5%";
    }

    return operations;
  };

  const getValidationReport = () => {
    const checks = [];
    
    if (options.detectBlur) checks.push("Blur Detection");
    if (options.detectBackground) checks.push("Background Validation");
    if (options.detectCropping) checks.push("Cropping Analysis");
    if (options.detectExposure) checks.push("Exposure Check");
    if (options.detectComposition) checks.push("Composition Analysis");
    
    const fixes = [];
    if (options.autoFixBackground) fixes.push("Auto Background Fix");
    if (options.autoFixCropping) fixes.push("Auto Cropping");
    if (options.autoEnhanceQuality) fixes.push("Quality Enhancement");
    if (options.optimizeForWeb) fixes.push("Web Optimization");
    
    const output = [];
    if (options.standardizeFormat) output.push(`Format: ${options.targetFormat.toUpperCase()}`);
    if (options.standardizeSize) output.push(`Size: ${options.targetSize}`);
    
    return { checks, fixes, output };
  };

  const handleValidate = () => {
    const operations = getValidationOperations();
    const outputFormat = options.standardizeFormat ? {
      type: options.targetFormat,
      compression: {
        type: "lossy",
        quality: 85
      }
    } : "jpeg";

    onValidate({
      operations,
      output: { format: outputFormat },
      validationOptions: options
    });
  };

  const validationReport = getValidationReport();

  return (
    <div className="space-y-4">
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Shield className="h-5 w-5" />
            E-commerce Image Validation
          </CardTitle>
          <CardDescription className="text-blue-600">
            Automatically detects and fixes common e-commerce image issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Validation Score</span>
              <Badge variant="default" className="bg-blue-600">
                Comprehensive
              </Badge>
            </div>
            <div className="h-2 w-full bg-blue-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 w-3/4"></div>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              {validationReport.checks.length} validation checks, {validationReport.fixes.length} auto-fixes
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Validation Checks Column */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Detection & Validation
            </CardTitle>
            <CardDescription>What to check in your images</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-2 hover:bg-muted rounded">
              <div className="flex items-center space-x-2">
                <Image className="h-4 w-4" />
                <Label htmlFor="detectBlur" className="cursor-pointer">
                  Blur Detection
                </Label>
              </div>
              <Checkbox
                id="detectBlur"
                checked={options.detectBlur}
                onCheckedChange={(checked) => handleOptionChange("detectBlur", checked)}
              />
            </div>
            
            <div className="flex items-center justify-between p-2 hover:bg-muted rounded">
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 bg-gradient-to-r from-white to-gray-300 rounded" />
                <Label htmlFor="detectBackground" className="cursor-pointer">
                  Background Validation
                </Label>
              </div>
              <Checkbox
                id="detectBackground"
                checked={options.detectBackground}
                onCheckedChange={(checked) => handleOptionChange("detectBackground", checked)}
              />
            </div>
            
            <div className="flex items-center justify-between p-2 hover:bg-muted rounded">
              <div className="flex items-center space-x-2">
                <Scissors className="h-4 w-4" />
                <Label htmlFor="detectCropping" className="cursor-pointer">
                  Cropping Issues
                </Label>
              </div>
              <Checkbox
                id="detectCropping"
                checked={options.detectCropping}
                onCheckedChange={(checked) => handleOptionChange("detectCropping", checked)}
              />
            </div>
            
            <div className="flex items-center justify-between p-2 hover:bg-muted rounded">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4" />
                <Label htmlFor="detectExposure" className="cursor-pointer">
                  Exposure Issues
                </Label>
              </div>
              <Checkbox
                id="detectExposure"
                checked={options.detectExposure}
                onCheckedChange={(checked) => handleOptionChange("detectExposure", checked)}
              />
            </div>
            
            <div className="flex items-center justify-between p-2 hover:bg-muted rounded">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <Label htmlFor="detectComposition" className="cursor-pointer">
                  Composition Analysis
                </Label>
              </div>
              <Checkbox
                id="detectComposition"
                checked={options.detectComposition}
                onCheckedChange={(checked) => handleOptionChange("detectComposition", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Auto-Fixes Column */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Automatic Fixes
            </CardTitle>
            <CardDescription>Apply these fixes automatically</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-2 hover:bg-muted rounded">
              <Label htmlFor="autoFixBackground" className="cursor-pointer">
                Fix Background Issues
              </Label>
              <Checkbox
                id="autoFixBackground"
                checked={options.autoFixBackground}
                onCheckedChange={(checked) => handleOptionChange("autoFixBackground", checked)}
              />
            </div>
            
            <div className="flex items-center justify-between p-2 hover:bg-muted rounded">
              <Label htmlFor="autoFixCropping" className="cursor-pointer">
                Fix Cropping Issues
              </Label>
              <Checkbox
                id="autoFixCropping"
                checked={options.autoFixCropping}
                onCheckedChange={(checked) => handleOptionChange("autoFixCropping", checked)}
              />
            </div>
            
            <div className="flex items-center justify-between p-2 hover:bg-muted rounded">
              <Label htmlFor="autoEnhanceQuality" className="cursor-pointer">
                Enhance Image Quality
              </Label>
              <Checkbox
                id="autoEnhanceQuality"
                checked={options.autoEnhanceQuality}
                onCheckedChange={(checked) => handleOptionChange("autoEnhanceQuality", checked)}
              />
            </div>
            
            <div className="flex items-center justify-between p-2 hover:bg-muted rounded">
              <Label htmlFor="optimizeForWeb" className="cursor-pointer">
                Optimize for Web
              </Label>
              <Checkbox
                id="optimizeForWeb"
                checked={options.optimizeForWeb}
                onCheckedChange={(checked) => handleOptionChange("optimizeForWeb", checked)}
              />
            </div>
            
            <div className="space-y-2 mt-4 pt-4 border-t">
              <div className="flex items-center justify-between p-2">
                <Label htmlFor="standardizeFormat" className="cursor-pointer">
                  Standardize Format
                </Label>
                <Checkbox
                  id="standardizeFormat"
                  checked={options.standardizeFormat}
                  onCheckedChange={(checked) => handleOptionChange("standardizeFormat", checked)}
                />
              </div>
              
              <div className="flex items-center justify-between p-2">
                <Label htmlFor="standardizeSize" className="cursor-pointer">
                  Standardize Size
                </Label>
                <Checkbox
                  id="standardizeSize"
                  checked={options.standardizeSize}
                  onCheckedChange={(checked) => handleOptionChange("standardizeSize", checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Validation Summary</CardTitle>
          <CardDescription>What will be checked and fixed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-semibold mb-2 text-sm">Detection Checks</h4>
              <ul className="space-y-1 text-sm">
                {validationReport.checks.map((check, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-blue-500 rounded-full"></div>
                    {check}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2 text-sm">Automatic Fixes</h4>
              <ul className="space-y-1 text-sm">
                {validationReport.fixes.map((fix, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-green-500 rounded-full"></div>
                    {fix}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2 text-sm">Output Settings</h4>
              <ul className="space-y-1 text-sm">
                {validationReport.output.map((setting, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-purple-500 rounded-full"></div>
                    {setting}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button 
        onClick={handleValidate} 
        className="w-full"
        disabled={disabled}
        size="lg"
      >
        <Shield className="mr-2 h-5 w-5" />
        Run E-commerce Validation & Optimization
      </Button>
    </div>
  );
}