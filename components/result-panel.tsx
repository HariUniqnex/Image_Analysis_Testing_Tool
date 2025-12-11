"use client";

import {
  Download,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Box,
  ImageIcon,
  Minimize2,
  Sparkles,
  Scissors,
  AlertTriangle,
  Info,
  BarChart3,
  ArrowRight,
  FileImage,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProcessingResult } from "./image-tester";
import { Maximize2 } from "lucide-react";

interface ResultPanelProps {
  results: ProcessingResult[];
  onClear: () => void;
}

const serviceLabels = {
  removebg: "Remove BG",
  meshy: "Meshy",
  googlecloud: "Google Cloud",
  cloudinary: "Cloudinary",
  crop: "Crop",
  resize: "Image Resize",
  "product-recognition": "Product Recognition",
  claid: "Claid E-commerce",
  "cloudinary-validate": "Cloudinary Validate",
};

export function ResultPanel({ results, onClear }: ResultPanelProps) {
  const handleDownload = async (url: string, service: string) => {
    const filename = `processed-${service}-${Date.now()}`;

    try {
      if (url.startsWith("data:image")) {
        const [meta, data] = url.split(",");
        const mime = meta.match(/:(.*?);/)?.[1] || "image/jpeg";
        const bin = atob(data);
        const buf = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
        const blob = new Blob([buf], { type: mime });
        triggerDownload(blob, `${filename}.${mime.split("/")[1] || "jpg"}`);
      } else {
        // Cloudinary or any public URL
        const res = await fetch(url, { mode: "cors" });
        const blob = await res.blob();
        const ext = blob.type.split("/")[1] || "jpg";
        triggerDownload(blob, `${filename}.${ext}`);
      }
    } catch (e) {
      // fallback: try direct link
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}.jpg`;
      a.click();
    }
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    const link = document.createElement("a");
    const href = URL.createObjectURL(blob);
    link.href = href;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Results</CardTitle>
            <CardDescription>Processed images will appear here</CardDescription>
          </div>
          {results.length > 0 && (
            <Button variant="outline" size="sm" onClick={onClear}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No results yet. Upload an image and select a service to process.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((result, index) => (
              <ResultCard
                key={index}
                result={result}
                onDownload={handleDownload}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ResultCard({
  result,
  onDownload,
}: {
  result: ProcessingResult;
  onDownload: (url: string, service: string) => void;
}) {
  const statusIcon = {
    idle: <Clock className="h-4 w-4 text-muted-foreground" />,
    processing: <Loader2 className="h-4 w-4 animate-spin text-primary" />,
    success: <CheckCircle className="h-4 w-4 text-green-500" />,
    error: <XCircle className="h-4 w-4 text-destructive" />,
  };

  const getOperationLabel = (operation?: string) => {
    switch (operation) {
      case "resize":
        return "Resize";
      case "lifestyle":
        return "Lifestyle";
      case "compress":
        return "Compress";
      case "ecommerce-optimization":
        return "E-commerce";
      default:
        return "Vision";
    }
  };

  const getOperationIcon = (operation?: string) => {
    switch (operation) {
      case "resize":
        return <ImageIcon className="h-4 w-4" />;
      case "lifestyle":
        return <Sparkles className="h-4 w-4" />;
      case "compress":
        return <Minimize2 className="h-4 w-4" />;
      case "crop":
        return <Scissors className="h-4 w-4" />;
      case "ecommerce-optimization":
        return <BarChart3 className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const optimizedUrl = (url: string) =>
    url.includes("/upload/")
      ? url.replace("/upload/", "/upload/f_auto,q_auto/")
      : url;

  const formatSize = (bytes?: number) => {
    if (!bytes) return "N/A";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Helper function to render Claid-specific results
  const renderClaidResults = (data: any) => {
    if (!data) return null;

    const validation = data.validation;
    const metadata = data.metadata;

    return (
      <div className="space-y-4">
        {/* Validation Summary Card */}
        {validation?.compliance && (
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold">E-commerce Validation</h4>
                <p className="text-sm text-muted-foreground">
                  {validation.compliance.passed
                    ? "✓ All checks passed"
                    : "⚠ Needs attention"}
                </p>
              </div>
              <Badge
                variant={
                  validation.compliance.passed ? "default" : "destructive"
                }
                className="text-sm"
              >
                {validation.compliance.passed ? "COMPLIANT" : "NON-COMPLIANT"}
              </Badge>
            </div>

            {/* Compliance Checks */}
            {validation.compliance.checks?.length > 0 && (
              <div className="space-y-2 mb-4">
                <h5 className="text-sm font-medium">Compliance Checks</h5>
                <div className="space-y-1.5">
                  {validation.compliance.checks.map((check: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="flex items-center gap-2">
                        {check.passed ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        {check.check}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {check.details}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quality Score Card */}
        {validation?.quality?.score !== undefined && (
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold">Quality Analysis</h4>
                <p className="text-sm text-muted-foreground">
                  Based on e-commerce standards
                </p>
              </div>
              <Badge
                variant={
                  validation.quality.score >= 0.8
                    ? "default"
                    : validation.quality.score >= 0.6
                    ? "secondary"
                    : "destructive"
                }
                className="text-sm"
              >
                {validation.quality.score >= 0.8
                  ? "EXCELLENT"
                  : validation.quality.score >= 0.6
                  ? "GOOD"
                  : "POOR"}
              </Badge>
            </div>

            <div className="space-y-3">
              {/* Score Bar */}
              <div>
                <div className="flex justify-between mb-1 text-sm">
                  <span>Overall Score</span>
                  <span className="font-bold">
                    {Math.round(validation.quality.score * 100)}/100
                  </span>
                </div>
                <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      validation.quality.score >= 0.8
                        ? "bg-green-500"
                        : validation.quality.score >= 0.6
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${validation.quality.score * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Poor</span>
                  <span>Average</span>
                  <span>Excellent</span>
                </div>
              </div>

              {/* Issues List */}
              {validation.quality.issues?.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium mb-2">Detected Issues</h5>
                  <div className="space-y-2">
                    {validation.quality.issues.map((issue: any, i: number) => (
                      <div
                        key={i}
                        className={`flex items-start gap-3 rounded-lg p-3 border ${
                          issue.severity === "high"
                            ? "bg-red-50 border-red-200"
                            : issue.severity === "medium"
                            ? "bg-amber-50 border-amber-200"
                            : "bg-blue-50 border-blue-200"
                        }`}
                      >
                        {issue.severity === "high" ? (
                          <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                        ) : issue.severity === "medium" ? (
                          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                        ) : (
                          <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium capitalize">
                              {issue.type}
                            </span>
                            <Badge
                              variant={
                                issue.severity === "high"
                                  ? "destructive"
                                  : issue.severity === "medium"
                                  ? "secondary"
                                  : "outline"
                              }
                              className="text-xs"
                            >
                              {issue.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            {issue.message}
                          </p>
                          {issue.suggestion && (
                            <div className="flex items-start gap-2 mt-2 pt-2 border-t border-border/50">
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-green-700">
                                {issue.suggestion}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Issues Message */}
              {(!validation.quality.issues ||
                validation.quality.issues.length === 0) && (
                <div className="rounded-lg bg-green-50 p-3 border border-green-200">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-green-800">
                        No issues detected
                      </p>
                      <p className="text-sm text-green-700">
                        Your image meets all e-commerce quality standards
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Optimization Results */}
        {metadata && (
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-semibold">Optimization Results</h4>
                <p className="text-sm text-muted-foreground">
                  Performance improvements applied
                </p>
              </div>
              {metadata.original_size &&
                metadata.new_size &&
                metadata.new_size < metadata.original_size && (
                  <Badge
                    variant="default"
                    className="bg-green-100 text-green-800 border-green-200"
                  >
                    {Math.round(
                      (1 - metadata.new_size / metadata.original_size) * 100
                    )}
                    % Smaller
                  </Badge>
                )}
            </div>

            <div className="space-y-4">
              {/* File Size Comparison */}
              {metadata.original_size && metadata.new_size && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">File Size</span>
                    <span className="text-muted-foreground">
                      {Math.round(
                        (1 - metadata.new_size / metadata.original_size) * 100
                      )}
                      % reduction
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1 text-xs">
                        <span>Original</span>
                        <span>{formatSize(metadata.original_size)}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gray-400 w-full" />
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex justify-between mb-1 text-xs">
                        <span>Optimized</span>
                        <span className="text-green-600 font-medium">
                          {formatSize(metadata.new_size)}
                        </span>
                      </div>
                      <div className="h-2 bg-green-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500"
                          style={{
                            width: `${
                              (metadata.new_size / metadata.original_size) * 100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Dimensions & Format */}
              <div className="grid grid-cols-2 gap-4">
                {metadata.width && metadata.height && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Dimensions</p>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 border rounded flex items-center justify-center">
                        <Maximize2 className="h-4 w-4" />
                      </div>
                      <span className="font-medium">
                        {metadata.width} × {metadata.height}
                      </span>
                    </div>
                  </div>
                )}

                {metadata.format && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Format</p>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 border rounded flex items-center justify-center">
                        <FileImage className="h-4 w-4" />
                      </div>
                      <Badge variant="outline" className="font-medium">
                        {metadata.format.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>

              {/* Applied Changes */}
              {validation?.optimization?.changes?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Applied Improvements</p>
                  <div className="flex flex-wrap gap-2">
                    {validation.optimization.changes.map(
                      (change: string, i: number) => (
                        <Badge key={i} variant="secondary" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          {change}
                        </Badge>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Processed Image Preview */}
        {result.resultUrl && (
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold">Processed Image</h4>
                <p className="text-sm text-muted-foreground">
                  E-commerce optimized version
                </p>
              </div>
              <Badge variant="outline">Ready for Use</Badge>
            </div>

            <div className="space-y-3">
              <div className="overflow-hidden rounded-lg border-2 border-border bg-gradient-to-br from-muted/30 to-background">
                <img
                  src={optimizedUrl(result.resultUrl)}
                  alt="E-commerce optimized image"
                  className="mx-auto max-h-[250px] w-auto object-contain p-2"
                  onError={(e) => {
                    // Fallback if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.src = "/placeholder.svg";
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={() =>
                    onDownload(
                      optimizedUrl(result.resultUrl!),
                      "claid-optimized"
                    )
                  }
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button
                  variant="default"
                  className="w-full"
                  onClick={() =>
                    window.open(optimizedUrl(result.resultUrl!), "_blank")
                  }
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Full Size
                </Button>
              </div>

              <div className="text-xs text-muted-foreground text-center">
                <p>Optimized for e-commerce platforms and web performance</p>
                {metadata?.format && (
                  <p>Format: {metadata.format.toUpperCase()} • Web-ready</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Original vs Optimized Comparison (if we have both URLs) */}
        {result.originalUrl && result.resultUrl && (
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">Before & After Comparison</h4>
              <Badge variant="outline">Visual Comparison</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Original</span>
                  {metadata?.original_size && (
                    <span className="text-xs text-muted-foreground">
                      {formatSize(metadata.original_size)}
                    </span>
                  )}
                </div>
                <div className="overflow-hidden rounded border border-border bg-muted/30">
                  <img
                    src={result.originalUrl}
                    alt="Original image"
                    className="w-full h-32 object-contain"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-700">
                    Optimized
                  </span>
                  {metadata?.new_size && (
                    <span className="text-xs text-green-600 font-medium">
                      {formatSize(metadata.new_size)}
                    </span>
                  )}
                </div>
                <div className="overflow-hidden rounded border-2 border-green-200 bg-green-50/30">
                  <img
                    src={optimizedUrl(result.resultUrl)}
                    alt="Optimized image"
                    className="w-full h-32 object-contain"
                  />
                </div>
              </div>
            </div>

            {metadata?.original_size && metadata?.new_size && (
              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex items-center justify-center gap-2 text-sm">
                  <span className="text-muted-foreground">Total savings:</span>
                  <span className="font-bold text-green-600">
                    {Math.round(
                      (1 - metadata.new_size / metadata.original_size) * 100
                    )}
                    % smaller
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">
                    {formatSize(metadata.original_size - metadata.new_size)}{" "}
                    saved
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {statusIcon[result.status]}
          <span className="font-medium text-foreground">
            {serviceLabels[result.service]}
          </span>
          {(result.service === "googlecloud" || result.service === "claid") &&
            result.data?.operation && (
              <Badge variant="outline" className="ml-1 gap-1 text-xs">
                {getOperationIcon(result.data.operation)}
                {getOperationLabel(result.data.operation)}
              </Badge>
            )}
        </div>
        <span className="text-xs text-muted-foreground">
          {result.timestamp.toLocaleTimeString()}
        </span>
      </div>

      {result.status === "processing" && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Processing image...</p>
          </div>
        </div>
      )}

      {result.status === "success" && (
        <div className="space-y-3">
          {/* Claid-specific results */}
          {result.service === "claid" && renderClaidResults(result.data)}

          {/* Cloudinary validation results */}
          {result.service === "cloudinary-validate" && (
            <div className="space-y-4">
              {/* Processed Image */}
              {result.resultUrl && (
                <div className="space-y-3">
                  <div className="overflow-hidden rounded-lg border border-border bg-muted/30">
                    <img
                      src={result.resultUrl}
                      alt="Cloudinary processed image"
                      className="mx-auto max-h-[200px] object-contain"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-transparent"
                      onClick={() =>
                        onDownload(result.resultUrl!, "cloudinary")
                      }
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(result.resultUrl!, "_blank")}
                    >
                      Open
                    </Button>
                  </div>
                </div>
              )}

              {/* Validation Results */}
              {result.data?.validation && (
                <div className="space-y-3">
                  <div className="rounded-lg border border-border p-3">
                    <h5 className="font-medium mb-2">Validation Results</h5>
                    <div className="space-y-2">
                      {result.data.validation.quality?.score !== undefined && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Quality Score</span>
                          <Badge variant="default">
                            {Math.round(
                              (result.data.validation.quality.score || 0) * 100
                            )}
                            /100
                          </Badge>
                        </div>
                      )}
                      {result.data.validation.compliance?.checks?.map(
                        (check: any, i: number) => (
                          <div
                            key={i}
                            className="flex items-center justify-between text-sm"
                          >
                            <span>{check.check}</span>
                            <div className="flex items-center gap-2">
                              {check.passed ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                              <span className="text-xs">{check.details}</span>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Metadata information */}
              {result.data?.metadata && (
                <div className="rounded-lg border border-border p-3">
                  <h5 className="font-medium mb-2">Optimization Details</h5>
                  <div className="space-y-2 text-sm">
                    {result.data.metadata.width &&
                      result.data.metadata.height && (
                        <div className="flex justify-between">
                          <span>Dimensions:</span>
                          <span>
                            {result.data.metadata.width} ×{" "}
                            {result.data.metadata.height}px
                          </span>
                        </div>
                      )}
                    {result.data.metadata.format && (
                      <div className="flex justify-between">
                        <span>Format:</span>
                        <Badge variant="outline">
                          {result.data.metadata.format.toUpperCase()}
                        </Badge>
                      </div>
                    )}
                    {result.data.metadata.transformations && (
                      <div>
                        <span className="text-xs text-muted-foreground">
                          Applied transformations:
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {result.data.metadata.transformations.map(
                            (t: string, i: number) => (
                              <Badge
                                key={i}
                                variant="secondary"
                                className="text-xs"
                              >
                                {t}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Remove Background results */}
          {result.service === "removebg" && result.resultUrl && (
            <>
              <div className="overflow-hidden rounded-lg border border-border bg-muted/30">
                <img
                  src={result.resultUrl || "/placeholder.svg"}
                  alt="Processed result"
                  className="mx-auto max-h-[200px] object-contain"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-transparent"
                  onClick={() => onDownload(result.resultUrl!, result.service)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(result.resultUrl!, "_blank")}
                >
                  Open
                </Button>
              </div>
            </>
          )}

          {/* Meshy results */}
          {result.service === "meshy" && result.data && (
            <div className="space-y-3">
              {result.resultUrl && (
                <div className="overflow-hidden rounded-lg border border-border bg-muted/30">
                  <img
                    src={result.resultUrl || "/placeholder.svg"}
                    alt="3D Model Thumbnail"
                    className="mx-auto max-h-[200px] object-contain"
                  />
                </div>
              )}
              {result.data.taskId && (
                <p className="text-xs text-muted-foreground">
                  Task ID: {result.data.taskId}
                </p>
              )}
              {result.data.modelUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full bg-transparent"
                  onClick={() => window.open(result.data!.modelUrl!, "_blank")}
                >
                  <Box className="mr-2 h-4 w-4" />
                  Download 3D Model (.glb)
                </Button>
              )}
              {!result.data.modelUrl && (
                <p className="text-sm text-muted-foreground">
                  Model is still processing. Check back later.
                </p>
              )}
            </div>
          )}

          {/* Google Cloud results */}
          {result.service === "googlecloud" && result.data && (
            <div className="space-y-4">
              {/* Resize results */}
              {result.data.operation === "resize" && (
                <div className="space-y-3">
                  {result.resultUrl && (
                    <div className="overflow-hidden rounded-lg border border-border bg-muted/30">
                      <img
                        src={result.resultUrl || "/placeholder.svg"}
                        alt="Resized image"
                        className="mx-auto max-h-[200px] object-contain"
                      />
                    </div>
                  )}
                  <div className="rounded-lg bg-muted/50 p-3 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-muted-foreground">
                          Target Size:
                        </span>{" "}
                        <span className="font-medium">
                          {result.data.dimensions?.width} x{" "}
                          {result.data.dimensions?.height}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Original:</span>{" "}
                        <span className="font-medium">
                          {formatSize(result.data.originalSize)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-transparent"
                      onClick={() => onDownload(result.resultUrl!, "resized")}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </div>
              )}

              {/* Lifestyle results */}
              {result.data.operation === "lifestyle" && (
                <div className="space-y-3">
                  {result.resultUrl && (
                    <div className="overflow-hidden rounded-lg border border-border bg-muted/30">
                      <img
                        src={result.resultUrl || "/placeholder.svg"}
                        alt="Lifestyle image"
                        className="mx-auto max-h-[200px] object-contain"
                      />
                    </div>
                  )}
                  <div className="rounded-lg bg-muted/50 p-3 text-sm">
                    <div className="space-y-1">
                      <div>
                        <span className="text-muted-foreground">Style:</span>{" "}
                        <Badge
                          variant="secondary"
                          className="ml-1 text-xs capitalize"
                        >
                          {(result.data as any)?.style || "modern"}
                        </Badge>
                      </div>
                      {(result.data as any)?.prompt && (
                        <div>
                          <span className="text-muted-foreground">Prompt:</span>{" "}
                          <span className="text-xs">
                            {(result.data as any).prompt}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-transparent"
                      onClick={() => onDownload(result.resultUrl!, "lifestyle")}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </div>
              )}

              {/* Vision API results */}
              {!result.data.operation && (
                <>
                  {result.data.labels && result.data.labels.length > 0 && (
                    <div>
                      <h5 className="mb-2 text-sm font-medium text-foreground">
                        Labels Detected
                      </h5>
                      <div className="flex flex-wrap gap-1.5">
                        {result.data.labels.slice(0, 10).map((label, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {label.description} ({Math.round(label.score * 100)}
                            %)
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.data.objects && result.data.objects.length > 0 && (
                    <div>
                      <h5 className="mb-2 text-sm font-medium text-foreground">
                        Objects Detected
                      </h5>
                      <div className="flex flex-wrap gap-1.5">
                        {result.data.objects.slice(0, 10).map((obj, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {obj.name} ({Math.round(obj.score * 100)}%)
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Cloudinary results */}
          {result.service === "cloudinary" && result.resultUrl && (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-lg border border-border bg-muted/30">
                <img
                  src={optimizedUrl(result.resultUrl)}
                  alt="Cloudinary image"
                  className="mx-auto max-h-[200px] object-contain"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-transparent"
                  onClick={() => onDownload(optimizedUrl(result.resultUrl!), "cloudinary")}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(optimizedUrl(result.resultUrl!), "_blank")}
                >
                  Open
                </Button>
              </div>
            </div>
          )}

          {/* Crop results */}
          {result.service === "crop" && result.resultUrl && (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-lg border border-border bg-muted/30">
                <img
                  src={optimizedUrl(result.resultUrl)}
                  alt="Cropped image"
                  className="mx-auto max-h-[200px] object-contain"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-transparent"
                  onClick={() => onDownload(optimizedUrl(result.resultUrl!), "crop")}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(optimizedUrl(result.resultUrl!), "_blank")}
                >
                  Open
                </Button>
              </div>
            </div>
          )}

          {/* Resize results */}
          {result.service === "resize" && result.resultUrl && (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-lg border border-border bg-muted/30">
                <img
                  src={optimizedUrl(result.resultUrl)}
                  alt="Resized image"
                  className="mx-auto max-h-[200px] object-contain"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-transparent"
                  onClick={() => onDownload(optimizedUrl(result.resultUrl!), "resize")}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(optimizedUrl(result.resultUrl!), "_blank")}
                >
                  Open
                </Button>
              </div>
            </div>
          )}

          {/* Product Recognition results */}
          {result.service === "product-recognition" && result.data && (
            <div className="space-y-4">
              {/* Show the original image */}
              {result.resultUrl && (
                <div className="overflow-hidden rounded-lg border border-border bg-muted/30">
                  <img
                    src={result.resultUrl || "/placeholder.svg"}
                    alt="Original image"
                    className="mx-auto max-h-[200px] object-contain"
                  />
                </div>
              )}
              
              {/* Display the recognized labels */}
              {result.data.labels && result.data.labels.length > 0 && (
                <div>
                  <h5 className="mb-2 text-sm font-medium text-foreground">
                    Labels Detected
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {result.data.labels.slice(0, 10).map((label, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="text-xs"
                      >
                        {label.description} ({Math.round(label.score * 100)}%)
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Display the recognized objects */}
              {result.data.objects && result.data.objects.length > 0 && (
                <div>
                  <h5 className="mb-2 text-sm font-medium text-foreground">
                    Objects Detected
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {result.data.objects.slice(0, 10).map((obj, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {obj.name} ({Math.round(obj.score * 100)}%)
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Display the recognized logos */}
              {result.data.logos && result.data.logos.length > 0 && (
                <div>
                  <h5 className="mb-2 text-sm font-medium text-foreground">
                    Logos Detected
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {result.data.logos.slice(0, 5).map((logo, i) => (
                      <Badge
                        key={i}
                        variant="destructive"
                        className="text-xs"
                      >
                        {logo.description} ({Math.round(logo.score * 100)}%)
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {result.status === "error" && (
        <div className="rounded-lg bg-destructive/10 p-3">
          <p className="text-sm text-destructive">
            {result.error || "An error occurred"}
          </p>
        </div>
      )}
    </div>
  );
}