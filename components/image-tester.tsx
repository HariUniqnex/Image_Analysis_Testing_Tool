"use client";

import { useState, useCallback, useEffect } from "react";
import { ImageUploader } from "./image-uploader";
import { ImagePreview } from "./image-preview";
import { ResultPanel } from "./result-panel";
import { uploadToCloudinary } from "./uploadToCloudinary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  GoogleCloudOptions,
  type GoogleCloudConfig,
} from "./google-cloud-options";
import { Button } from "@/components/ui/button";
import ImageCropEditor from "./ImageCropEditor";
import ResizePanel from "./ResizePanel";
import ProductRecognitionPanel from "./ProductRecognitionPanel";
import { ClaidPanel } from "./claid-panel";
import { ClaidOptionsPanel } from "./claid-options";
import { EcommerceValidationPanel } from "./ecommerce-validation-panel";
import { CloudinaryValidationPanel } from "./cloudinary-validation-panel";

export type ProcessingService =
  | "removebg"
  | "meshy"
  | "googlecloud"
  | "cloudinary"
  | "crop"
  | "resize"
  | "product-recognition"
  | "claid"
  | "cloudinary-validate"; 
export interface ClaidValidation {
  quality: {
    score: number;
    issues: Array<{
      type: "blur" | "exposure" | "composition" | "noise";
      severity: "low" | "medium" | "high";
      message: string;
    }>;
  };
  compliance: {
    passed: boolean;
    checks: Array<{
      check: string;
      passed: boolean;
      details?: string;
    }>;
  };
  suggestions: string[];
}
export interface ProcessingResult {
  service: ProcessingService;
  originalUrl: string;
  resultUrl: string | null;
  status: "idle" | "processing" | "success" | "error";
  error?: string;
  timestamp: Date;
  data?: {
    labels?: Array<{ description: string; score: number }>;
    logos?: Array<{ description: string; score: number }>;
    objects?: Array<{ name: string; score: number }>;
    modelUrl?: string;
    taskId?: string;
    operation?: string;
    originalSize?: number;
    newSize?: number;
    dimensions?: { width: number; height: number };
        validation?: {
      quality?: {
        score: number;
        issues?: Array<{
          type: string;
          severity: 'low' | 'medium' | 'high';
          message: string;
          suggestion?: string;
        }>;
      };
      compliance?: {
        passed: boolean;
        checks?: Array<{
          check: string;
          passed: boolean;
          details: string;
        }>;
      };
      optimization?: {
        changes?: string[];
      };
    };
    
    // Add metadata properties
    metadata?: {
      width?: number;
      height?: number;
      format?: string;
      original_size?: number;
      new_size?: number;
      transformations?: string[];
    };
    
    // Add other properties you're using
    style?: string;
    prompt?: string;
  };
  };


export function ImageTester() {
  const [imageSource, setImageSource] = useState<string | null>(null);
  const [results, setResults] = useState<ProcessingResult[]>([]);
  const [activeTab, setActiveTab] = useState("removebg");
  const [isCropping, setIsCropping] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | File | null>(
    null
  );
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [googleCloudConfig, setGoogleCloudConfig] = useState<GoogleCloudConfig>(
    {
      operation: "resize",
      width: 800,
      height: 600,
      maintainAspectRatio: true,
      quality: 80,
      format: "jpeg",
      style: "modern",
    }
  );
  useEffect(() => {
    if (
      (activeTab === "resize" || activeTab === "crop") &&
      originalImage &&
      (typeof imageSource !== "string" ||
        (!imageSource.includes("/upload/") && !imageSource.includes("/fetch/")))
    ) {
      uploadToCloudinary(originalImage).then((url) => setImageSource(url));
    }
  }, [activeTab, originalImage, imageSource]);
  const handleImageSelect = useCallback((source: string | File) => {
    setOriginalImage(source);
    setImageSource(typeof source === "string" ? source : ""); // or null
    setResults([]);
  }, []);
// Add to image-tester.tsx
const handleCloudinaryValidation = useCallback(async (selectedOperations?: any) => {
  if (!imageSource) return;

  const newResult: ProcessingResult = {
    service: "cloudinary",
    originalUrl: imageSource,
    resultUrl: null,
    status: "processing",
    timestamp: new Date(),
  };

  setResults((prev) => [...prev, newResult]);

  try {
    let imageUrl = imageSource;
    
    // Upload to Cloudinary if it's base64
    if (imageSource.startsWith("data:")) {
      imageUrl = await uploadToCloudinary(imageSource);
    }

    const payload = {
      imageUrl: imageUrl,
      operations: selectedOperations?.operations || {}
    };

    const response = await fetch("/api/cloudinary-validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Cloudinary processing failed");
    }

    setResults((prev) =>
      prev.map((r) =>
        r.timestamp === newResult.timestamp
          ? {
              ...r,
              status: "success",
              resultUrl: data.resultUrl,
              data: {
                validation: data.validation,
                metadata: data.metadata,
                operation: 'ecommerce-validation',
              },
            }
          : r
      )
    );
  } catch (error) {
    console.error('Cloudinary validation error:', error);
    setResults((prev) =>
      prev.map((r) =>
        r.timestamp === newResult.timestamp
          ? {
              ...r,
              status: "error",
              error:
                error instanceof Error
                  ? error.message
                  : "Cloudinary validation failed",
            }
          : r
      )
    );
  }
}, [imageSource]);
  const handleProcess = useCallback(
    async (service: ProcessingService) => {
      if (!imageSource) return;

      const newResult: ProcessingResult = {
        service,
        originalUrl: imageSource,
        resultUrl: null,
        status: "processing",
        timestamp: new Date(),
      };

      setResults((prev) => [...prev, newResult]);

      try {
        const isBase64 = imageSource.startsWith("data:");
        let payload: Record<string, unknown> = isBase64
          ? { imageBase64: imageSource }
          : { imageUrl: imageSource };

        if (service === "googlecloud") {
          payload = {
            ...payload,
            operation: googleCloudConfig.operation,
            options: {
              width: googleCloudConfig.width,
              height: googleCloudConfig.height,
              maintainAspectRatio: googleCloudConfig.maintainAspectRatio,
              quality: googleCloudConfig.quality,
              format: googleCloudConfig.format,
              prompt: googleCloudConfig.prompt,
              style: googleCloudConfig.style,
            },
          };
        }

        let endpoint = "";
        switch (service) {
          case "removebg":
            endpoint = "/api/remove-bg";
            break;
          case "meshy":
            endpoint = "/api/meshy";
            break;
          case "googlecloud":
            endpoint = "/api/google-cloud";
            break;
          case "claid":
            endpoint = "/api/claid";

            // Get operations from sessionStorage or use defaults
            const storedOps = sessionStorage.getItem("claid_operations");
            const operations = storedOps ? JSON.parse(storedOps) : null;

            if (operations) {
              payload = { ...payload, operations };
            }
            break;
        }

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Processing failed");
        }

        setResults((prev) =>
          prev.map((r) =>
            r.timestamp === newResult.timestamp
              ? {
                  ...r,
                  status: "success",
                  resultUrl: data.resultUrl || data.thumbnailUrl || imageSource,
                  data: {
                    labels: data.labels,
                    objects: data.objects,
                    modelUrl: data.modelUrl,
                    taskId: data.taskId,
                    operation: data.operation,
                    originalSize: data.originalSize,
                    newSize: data.newSize,
                    dimensions: data.dimensions,
                  },
                }
              : r
          )
        );
      } catch (error) {
        setResults((prev) =>
          prev.map((r) =>
            r.timestamp === newResult.timestamp
              ? {
                  ...r,
                  status: "error",
                  error:
                    error instanceof Error
                      ? error.message
                      : "Processing failed",
                }
              : r
          )
        );
      }
    },
    [imageSource, googleCloudConfig]
  );
  // Add this function inside your ImageTester component, right after handleProcess
  // Update your handleClaidValidation function
  // In image-tester.tsx, update the handleClaidValidation function
  // Update in image-tester.tsx
  // UPDATE ONLY THE handleClaidValidation function in image-tester.tsx
  const handleClaidValidation = useCallback(
    async (selectedOperations?: any) => {
      if (!imageSource) return;

      const newResult: ProcessingResult = {
        service: "claid",
        originalUrl: imageSource,
        resultUrl: null,
        status: "processing",
        timestamp: new Date(),
      };

      setResults((prev) => [...prev, newResult]);

      try {
        // Check if imageSource is a URL or base64
        const isBase64 = imageSource.startsWith("data:");

        let imageUrl = imageSource;

        // ALWAYS upload to Cloudinary first if it's base64
        if (isBase64) {
          console.log("Uploading base64 image to Cloudinary first...");

          // Create a Cloudinary upload result
          const cloudinaryUploadResult: ProcessingResult = {
            service: "cloudinary",
            originalUrl: imageSource,
            resultUrl: null,
            status: "processing",
            timestamp: new Date(),
            data: {
              operation: "upload-for-claid",
            },
          };

          setResults((prev) => [...prev, cloudinaryUploadResult]);

          try {
            // Upload to Cloudinary
            const cloudinaryUrl = await uploadToCloudinary(imageSource);
            console.log(
              "Uploaded to Cloudinary:",
              cloudinaryUrl.substring(0, 100)
            );

            // Update Cloudinary result
            setResults((prev) =>
              prev.map((r) =>
                r.timestamp === cloudinaryUploadResult.timestamp
                  ? {
                      ...r,
                      status: "success",
                      resultUrl: cloudinaryUrl,
                      data: {
                        ...r.data,
                        originalSize: undefined,
                        newSize: undefined,
                      },
                    }
                  : r
              )
            );

            imageUrl = cloudinaryUrl;
          } catch (uploadError) {
            // Update Cloudinary result with error
            setResults((prev) =>
              prev.map((r) =>
                r.timestamp === cloudinaryUploadResult.timestamp
                  ? {
                      ...r,
                      status: "error",
                      error:
                        uploadError instanceof Error
                          ? uploadError.message
                          : "Cloudinary upload failed",
                    }
                  : r
              )
            );
            throw new Error(
              `Failed to upload to Cloudinary: ${
                uploadError instanceof Error
                  ? uploadError.message
                  : "Upload failed"
              }`
            );
          }
        }
        // Add to image-tester.tsx

        // Now call Claid API with the Cloudinary URL
        const payload = {
          imageUrl: imageUrl,
          operations: selectedOperations?.operations || {
            restorations: {
              decompress: "moderate",
              polish: true,
            },
            resizing: {
              width: 1200,
              height: 1200,
              fit: { type: "crop", crop: "smart" },
            },
            adjustments: {
              hdr: { intensity: 0.3, stitching: true },
              exposure: 0.1,
              saturation: 0.15,
              contrast: 0.1,
              sharpness: 0.2,
            },
            background: {
              remove: {
                category: "products",
                selective: { object_to_keep: "product" },
                clipping: true,
              },
              color: "#ffffff",
            },
            padding: "5%",
            privacy: {
              blur_car_plate: false,
            },
          },
          output: selectedOperations?.output || {
            format: {
              type: "webp",
              compression: {
                type: "lossy",
                quality: 10 - 0,
              },
            },
          },
        };

        console.log(
          "Calling Claid API with Cloudinary URL:",
          imageUrl.substring(0, 100) + "..."
        );

        const response = await fetch("/api/claid", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || `Claid processing failed: ${response.status}`
          );
        }

        // Update the Claid result with success
        setResults((prev) =>
          prev.map((r) =>
            r.timestamp === newResult.timestamp
              ? {
                  ...r,
                  status: "success",
                  resultUrl: data.resultUrl,
                  data: {
                    validation: data.validation,
                    metadata: data.metadata,
                    operation: "ecommerce-validation",
                  },
                }
              : r
          )
        );
      } catch (error) {
        console.error("Claid validation error:", error);
        setResults((prev) =>
          prev.map((r) =>
            r.timestamp === newResult.timestamp
              ? {
                  ...r,
                  status: "error",
                  error:
                    error instanceof Error
                      ? error.message
                      : "Claid validation failed",
                }
              : r
          )
        );
      }
    },
    [imageSource]
  );
  const handleClearResults = useCallback(() => {
    setResults([]);
  }, []);

  const handleClearImage = useCallback(() => {
    setImageSource(null);
    setResults([]);
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Left Panel - Input */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Image Input</CardTitle>
            <CardDescription>
              Upload an image or paste a URL to process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImageUploader
              onImageSelect={handleImageSelect}
              onClear={handleClearImage}
            />
          </CardContent>
        </Card>

        {imageSource && (
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>Original image</CardDescription>
            </CardHeader>
            <CardContent>
              <ImagePreview
                src={imageSource || "/placeholder.svg"}
                alt="Original image"
              />
              {isCropping && imageSource && (
                <ImageCropEditor
                  imageSrc={imageSource}
                  onBack={() => setIsCropping(false)}
                  onUploaded={(url) => {
                    setIsCropping(false);
                    setUploadedUrl(url);
                    setImageSource(url);

                    const cloudinaryResult: ProcessingResult = {
                      service: "cloudinary", // or a new value like "cloudinary" if you want
                      originalUrl: imageSource!,
                      resultUrl: url,
                      status: "success",
                      timestamp: new Date(),
                      data: {
                        operation: "crop",
                        originalSize: undefined, // optional — you can get it later via HEAD or from upload
                        newSize: undefined,
                        dimensions: undefined,
                      },
                    };

                    setResults((prev) => [...prev, cloudinaryResult]);
                  }}
                />
              )}
            </CardContent>
          </Card>
        )}

        {imageSource && (
          <Card>
            <CardHeader>
              <CardTitle>Process Image</CardTitle>
              <CardDescription>
                Select a service to process your image
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                defaultValue="removebg"
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-7 px-0">
                  {" "}
                  {/* Changed from 6 to 7 */}
                  <TabsTrigger
                    value="removebg"
                    className="px-2 text-xs sm:text-sm"
                  >
                    Remove BG
                  </TabsTrigger>
                  <TabsTrigger
                    value="meshy"
                    className="px-2 text-xs sm:text-sm"
                  >
                    Meshy
                  </TabsTrigger>
                  <TabsTrigger
                    value="googlecloud"
                    className="px-2 text-xs sm:text-sm"
                  >
                    G Cloud
                  </TabsTrigger>
                  <TabsTrigger value="crop" className="px-2 text-xs sm:text-sm">
                    Crop
                  </TabsTrigger>
                  <TabsTrigger
                    value="resize"
                    className="px-2 text-xs sm:text-sm"
                  >
                    Resize
                  </TabsTrigger>
                  <TabsTrigger
                    value="claid"
                    className="px-2 text-xs sm:text-sm"
                  >
                    {" "}
                    {/* New */}
                    Claid
                  </TabsTrigger>
                  <TabsTrigger
                    value="product-recognition"
                    className="px-2 text-xs sm:text-sm"
                  >
                    Recognition
                  </TabsTrigger>
                   <TabsTrigger value="cloudinary" className="px-2 text-xs sm:text-sm"> {/* ADD THIS LINE */}
    Cloudinary
  </TabsTrigger>
                </TabsList>
                <TabsContent value="removebg" className="mt-4">
                  <ServicePanel
                    service="removebg"
                    title="Remove Background"
                    description="Remove the background from your image using Remove.bg API"
                    onProcess={() => handleProcess("removebg")}
                  />
                </TabsContent>
                <TabsContent value="cloudinary" className="mt-4">
                  {" "}
                  <CloudinaryValidationPanel
                    onValidate={handleCloudinaryValidation}
                    disabled={!imageSource}
                  />
                </TabsContent>
                <TabsContent value="claid" className="mt-4">
                  <EcommerceValidationPanel
                    onValidate={handleClaidValidation}
                    disabled={!imageSource}
                  />
                </TabsContent>
                <TabsContent value="meshy" className="mt-4">
                  <ServicePanel
                    service="meshy"
                    title="Meshy 3D"
                    description="Generate 3D models from your image using Meshy API"
                    onProcess={() => handleProcess("meshy")}
                  />
                </TabsContent>
                
                <TabsContent value="crop" className="mt-4">
                  {imageSource ? (
                    <ImageCropEditor
                      imageSrc={imageSource}
                      onBack={() => {
                        /* optional: toast or no-op */
                      }}
                      onUploaded={(url) => {
                        setUploadedUrl(url);
                        setImageSource(url);

                        const cropResult: ProcessingResult = {
                          service: "crop",
                          originalUrl: imageSource!,
                          resultUrl: url,
                          status: "success",
                          timestamp: new Date(),
                          data: { operation: "crop" },
                        };

                        setResults((prev) => [...prev, cropResult]);
                      }}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Upload an image first.
                    </p>
                  )}
                </TabsContent>
                <TabsContent value="product-recognition" className="mt-4">
                  <ProductRecognitionPanel
                    imageSource={imageSource}
                    onRecognitionComplete={(recognitionData) => {
                      const productRecognitionResult: ProcessingResult = {
                        service: "product-recognition",
                        originalUrl: imageSource!,
                        resultUrl: imageSource,
                        status: "success",
                        timestamp: new Date(),
                        data: {
                          labels: recognitionData.labels,
                          objects: recognitionData.objects,
                          logos: recognitionData.logos, // Add this line
                        },
                      };
                      setResults((prev) => [...prev, productRecognitionResult]);
                    }}
                  />
                </TabsContent>
                <TabsContent value="googlecloud" className="mt-4">
                  <div className="space-y-4">
                    <GoogleCloudOptions
                      config={googleCloudConfig}
                      onChange={setGoogleCloudConfig}
                    />
                    <button
                      onClick={() => handleProcess("googlecloud")}
                      className="w-full rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      Process with Google Cloud
                    </button>
                  </div>
                </TabsContent>
                <TabsContent value="resize" className="mt-4">
                  <ResizePanel
                    imageUrl={imageSource}
                    onResized={(url) => {
                      setImageSource(url);
                      const resizeResult: ProcessingResult = {
                        service: "resize",
                        originalUrl: imageSource!,
                        resultUrl: url,
                        status: "success",
                        timestamp: new Date(),
                        data: { operation: "resize" },
                      };
                      setResults((prev) => [...prev, resizeResult]);
                    }}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right Panel - Results */}
      <div>
        <ResultPanel results={results} onClear={handleClearResults} />
      </div>
    </div>
  );
}

function ServicePanel({
  service,
  title,
  description,
  onProcess,
}: {
  service: ProcessingService;
  title: string;
  description: string;
  onProcess: () => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium text-foreground">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <button
        onClick={onProcess}
        className="w-full rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Process with {title}
      </button>
    </div>
  );
}
