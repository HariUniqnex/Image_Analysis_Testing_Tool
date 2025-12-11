import { NextResponse, NextRequest } from "next/server";
// Update ONLY the claidPayload in /app/api/claid/route.ts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, operations, output } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    const claidApiKey = process.env.CLAID_API_KEY;

    if (!claidApiKey) {
      return NextResponse.json(
        { error: "Claid API key not configured" },
        { status: 500 }
      );
    }

    const claidEndpoint = "https://api.claid.ai/v1/image/edit";

    // Clean and validate the operations
    // Update ONLY the background cleaning section in /app/api/claid/route.ts
    // Clean and validate the operations
    let cleanedOperations = operations || {};

    // If adjustments exist, ensure all values are integers
    if (cleanedOperations.adjustments) {
      cleanedOperations.adjustments = {
        hdr:
          typeof cleanedOperations.adjustments.hdr === "number"
            ? Math.round(cleanedOperations.adjustments.hdr)
            : 0,
        exposure:
          typeof cleanedOperations.adjustments.exposure === "number"
            ? Math.round(cleanedOperations.adjustments.exposure)
            : 0,
        saturation:
          typeof cleanedOperations.adjustments.saturation === "number"
            ? Math.round(cleanedOperations.adjustments.saturation)
            : 0,
        contrast:
          typeof cleanedOperations.adjustments.contrast === "number"
            ? Math.round(cleanedOperations.adjustments.contrast)
            : 0,
        sharpness:
          typeof cleanedOperations.adjustments.sharpness === "number"
            ? Math.round(cleanedOperations.adjustments.sharpness)
            : 0,
      };
    }

    // Remove null values from restorations
    if (cleanedOperations.restorations) {
      if (cleanedOperations.restorations.decompress === null) {
        delete cleanedOperations.restorations.decompress;
      }
      if (cleanedOperations.restorations.polish === false) {
        delete cleanedOperations.restorations.polish;
      }
    }

    // Fix background.remove format
    if (cleanedOperations.background) {
      // Remove null color
      if (cleanedOperations.background.color === null) {
        delete cleanedOperations.background.color;
      }

      // Fix background.remove format
      if (cleanedOperations.background.remove) {
        const removeValue = cleanedOperations.background.remove;

        if (typeof removeValue === "object") {
          // It's an object, make sure it has proper format
          if (removeValue.category && removeValue.selective) {
            // Remove selective if both are present (choose one)
            delete removeValue.selective;
          }

          // Ensure it's valid
          if (removeValue.category || removeValue.selective) {
            // Keep as object
            cleanedOperations.background.remove = removeValue;
          } else {
            // If no valid properties, set to true
            cleanedOperations.background.remove = true;
          }
        } else if (removeValue === false) {
          // Keep as false
          cleanedOperations.background.remove = false;
        } else {
          // Convert truthy to true
          cleanedOperations.background.remove = true;
        }
      }
    }

    // If operations are empty after cleaning, use a simple default
    if (Object.keys(cleanedOperations).length === 0) {
      cleanedOperations = {
        resizing: {
          width: 1200,
          height: 1200,
          fit: "bounds",
        },
      };
    }

    const claidPayload = {
      input: imageUrl,
      operations: cleanedOperations,
      output: output || {
        format: "jpeg",
      },
    };

    console.log(
      "Cleaned Claid payload:",
      JSON.stringify(claidPayload, null, 2)
    );

    const response = await fetch(claidEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${claidApiKey}`,
        Accept: "application/json",
      },
      body: JSON.stringify(claidPayload),
    });

    const responseText = await response.text();
    console.log("Claid response:", responseText);

    if (!response.ok) {
      let errorMessage = `Claid API error: ${response.status}`;

      try {
        const errorData = JSON.parse(responseText);
        errorMessage =
          errorData.error_message ||
          errorData.detail ||
          errorData.message ||
          errorData.error ||
          errorMessage;

        // Add validation error details
        if (errorData.error_details) {
          const details = Object.entries(errorData.error_details)
            .map(
              ([key, value]) =>
                `${key}: ${Array.isArray(value) ? value.join(", ") : value}`
            )
            .join("; ");
          errorMessage += ` - ${details}`;
        }
      } catch {
        errorMessage += ` - ${responseText.substring(0, 200)}`;
      }

      throw new Error(errorMessage);
    }

    const data = JSON.parse(responseText);
    const resultUrl = data.data?.output?.tmp_url;

    if (!resultUrl) {
      throw new Error("Claid API did not return a processed image URL");
    }

    return NextResponse.json({
      success: true,
      resultUrl: resultUrl,
      metadata: {
        original_size: data.data?.input?.mps * 1000000,
        new_size: data.data?.output?.mps * 1000000,
        width: data.data?.output?.width,
        height: data.data?.output?.height,
        format: data.data?.output?.format,
      },
    });
  } catch (error) {
    console.error("Claid processing error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Processing failed",
      },
      { status: 500 }
    );
  }
}
