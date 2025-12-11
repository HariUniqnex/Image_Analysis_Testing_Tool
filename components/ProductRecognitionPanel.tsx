"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

// Define the result type based on our backend response
interface RecognitionResult {
  labels: Array<{ description: string; score: number; source?: string }>;
  objects: Array<{ name: string; score: number }>;
  logos?: Array<{ description: string; score: number }>;
  productDetails?: {
    title: string | null;
    price: string | null;
    currency: string | null;
    stores: Array<{ name: string; price?: string; link?: string; currency?: string }>;
    similarProducts: Array<{ title: string; source?: string; price?: string; thumbnail?: string; link?: string }>;
  };
  visualMatches?: Array<any>;
  searchMetadata?: {
    status: string;
    imageUrl: string;
    processedAt: string;
  };
  success?: boolean;
}

interface ProductRecognitionPanelProps {
  imageSource: string | null; // Can be URL or base64 data URL
  onRecognitionComplete: (data: RecognitionResult) => void;
  showAdvancedResults?: boolean;
}

export default function ProductRecognitionPanel({
  imageSource,
  onRecognitionComplete,
  showAdvancedResults = false
}: ProductRecognitionPanelProps) {
  const [recognitionResults, setRecognitionResults] = useState<RecognitionResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleProductRecognition = async () => {
    if (!imageSource) {
      setError("Please upload or capture an image first");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(false);

    try {
      // Determine if it's a base64 data URL or regular URL
      const isBase64 = imageSource.startsWith('data:image/');
      
      const payload = isBase64 
        ? { imageBase64: imageSource }
        : { imageUrl: imageSource };

      const response = await fetch('/api/product-recognition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Product recognition failed');
      }

      if (!data.success) {
        throw new Error(data.error || 'Recognition was not successful');
      }

      // Format results to match the expected structure
      const results: RecognitionResult = {
        labels: data.labels || [],
        objects: data.objects || [],
        logos: data.logos || [],
        productDetails: data.productDetails || {
          title: null,
          price: null,
          currency: null,
          stores: [],
          similarProducts: []
        },
        visualMatches: data.visualMatches,
        searchMetadata: data.searchMetadata,
        success: data.success
      };

      setRecognitionResults(results);
      setSuccess(true);
      
      // Call the callback to update parent component
      onRecognitionComplete(results);

    } catch (err) {
      console.error('Recognition error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setSuccess(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Product Recognition
            {success && <CheckCircle2 className="h-5 w-5 text-green-500" />}
          </CardTitle>
          <CardDescription>
            Detect products, objects, and brands in the image using Google Lens
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleProductRecognition} 
            disabled={!imageSource || isProcessing}
            className="w-full"
            variant={success ? "secondary" : "default"}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : success ? (
              'Recognize Again'
            ) : (
              'Recognize Products'
            )}
          </Button>

          {imageSource && !isProcessing && !success && (
            <div className="text-sm text-muted-foreground">
              Ready to analyze: {imageSource.startsWith('data:') ? 'Image (base64)' : 'Image URL'}
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && recognitionResults && (
            <div className="space-y-4 pt-4 border-t">
              {/* Search Status */}
              {recognitionResults.searchMetadata && (
                <div className="text-sm text-muted-foreground">
                  Status: <span className="font-medium">{recognitionResults.searchMetadata.status}</span>
                  <div className="text-xs">
                    Processed at: {new Date(recognitionResults.searchMetadata.processedAt).toLocaleTimeString()}
                  </div>
                </div>
              )}

              {/* Product Details (if available) */}
              {recognitionResults.productDetails?.title && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-lg">Detected Product:</h4>
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="font-medium">{recognitionResults.productDetails.title}</div>
                    {recognitionResults.productDetails.price && (
                      <div className="text-green-600 font-semibold">
                        {recognitionResults.productDetails.currency || '$'}{recognitionResults.productDetails.price}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Labels */}
              {recognitionResults.labels.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Detected Items:</h4>
                  <div className="flex flex-wrap gap-2">
                    {recognitionResults.labels.slice(0, 10).map((label, index) => (
                      <div
                        key={index}
                        className="bg-secondary px-3 py-1 rounded-full text-sm flex items-center gap-1"
                        title={`Confidence: ${(label.score * 100).toFixed(1)}%`}
                      >
                        <span>{label.description}</span>
                        <span className="text-xs text-muted-foreground">
                          {(label.score * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                  {recognitionResults.labels.length > 10 && (
                    <div className="text-xs text-muted-foreground">
                      +{recognitionResults.labels.length - 10} more items
                    </div>
                  )}
                </div>
              )}

              {/* Stores (if available) */}
              {recognitionResults.productDetails?.stores && 
               recognitionResults.productDetails.stores.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Available at:</h4>
                  <div className="space-y-1">
                    {recognitionResults.productDetails.stores.slice(0, 5).map((store, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="font-medium">{store.name}</span>
                        {store.price && (
                          <span className="text-green-600">
                            {store.currency || '$'}{store.price}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Logos */}
              {recognitionResults.logos && recognitionResults.logos.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Brands Detected:</h4>
                  <div className="flex flex-wrap gap-2">
                    {recognitionResults.logos.map((logo, index) => (
                      <div
                        key={index}
                        className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {logo.description}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Objects */}
              {recognitionResults.objects.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Objects Detected:</h4>
                  <div className="flex flex-wrap gap-2">
                    {recognitionResults.objects.slice(0, 5).map((obj, index) => (
                      <div
                        key={index}
                        className="bg-secondary px-3 py-1 rounded-full text-sm"
                        title={`Confidence: ${(obj.score * 100).toFixed(1)}%`}
                      >
                        {obj.name} ({(obj.score * 100).toFixed(0)}%)
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Visual Matches Count */}
              {recognitionResults.visualMatches && (
                <div className="text-sm text-muted-foreground">
                  Found {recognitionResults.visualMatches.length} visual matches
                </div>
              )}

              {/* Show Advanced Results Toggle */}
              {showAdvancedResults && recognitionResults && (
                <div className="pt-4 border-t">
                  <details>
                    <summary className="cursor-pointer font-medium text-sm">
                      Advanced Results
                    </summary>
                    <div className="mt-2 text-xs">
                      <pre className="bg-muted p-3 rounded overflow-auto max-h-60">
                        {JSON.stringify(recognitionResults, null, 2)}
                      </pre>
                    </div>
                  </details>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}