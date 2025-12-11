// Update your ClaidPanel component
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";

interface ClaidPanelProps {
  onValidate: () => void;
  imageSource: string | null;
}

export function ClaidPanel({ onValidate, imageSource }: ClaidPanelProps) {
  const isBase64 = imageSource?.startsWith("data:");
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Claid.ai E-commerce Validation
        </CardTitle>
        <CardDescription>
          Professional image validation and optimization for e-commerce
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isBase64 && (
          <div className="rounded-lg bg-blue-50 p-3 border border-blue-200">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-700">Note</p>
                <p className="text-blue-600">
                  Your image will be uploaded to Cloudinary first to get a public URL for Claid processing.
                  This ensures Claid API can access your image.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-start gap-3 rounded-lg border p-3">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium">Quality Validation</h4>
              <p className="text-sm text-muted-foreground">
                Detects blur, exposure issues, incorrect backgrounds, and cropping problems
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 rounded-lg border p-3">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium">Auto-Optimization</h4>
              <p className="text-sm text-muted-foreground">
                Background removal/standardization, smart cropping, and web optimization
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 rounded-lg border p-3">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium">E-commerce Compliance</h4>
              <p className="text-sm text-muted-foreground">
                Ensures images meet platform requirements for size, format, and quality
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-amber-50 p-3 border border-amber-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-amber-700">Requirements</p>
              <ul className="text-amber-600 list-disc pl-4 space-y-1 mt-1">
                <li>Image must be publicly accessible via URL</li>
                <li>Maximum file size: 100MB</li>
                <li>Supported formats: JPEG, PNG, WebP, TIFF</li>
                <li>API key must be configured in .env.local</li>
              </ul>
            </div>
          </div>
        </div>

        <Button 
          onClick={onValidate} 
          className="w-full"
          disabled={!imageSource}
        >
          Validate & Optimize with Claid
        </Button>
        
        {!imageSource && (
          <p className="text-sm text-muted-foreground text-center">
            Please upload an image first
          </p>
        )}
      </CardContent>
    </Card>
  );
}