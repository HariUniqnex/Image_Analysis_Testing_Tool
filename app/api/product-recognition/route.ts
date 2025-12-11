// app/api/product-recognition/route.ts
import { NextRequest, NextResponse } from 'next/server';

const SERPAPI_KEY = process.env.SERPAPI_KEY;
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

// Upload base64 image to Cloudinary using unsigned upload (no API key needed)
async function uploadToCloudinary(base64Data: string): Promise<string> {
  try {
    console.log("Uploading to Cloudinary with unsigned preset...");
    
    // Remove data URL prefix if present
    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
    
    // For Cloudinary unsigned upload, we need to send form data
    const formData = new FormData();
    formData.append('file', `data:image/png;base64,${cleanBase64}`);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET!);
    
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;
    
    console.log("Cloudinary URL:", cloudinaryUrl.replace(CLOUDINARY_CLOUD_NAME!, '***'));
    console.log("Upload preset:", CLOUDINARY_UPLOAD_PRESET);
    
    const response = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Cloudinary upload failed:", response.status, errorText);
      throw new Error(`Cloudinary upload failed: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Cloudinary upload successful, URL:", data.secure_url);
    
    return data.secure_url;
    
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
}

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, imageBase64 } = await request.json();

    if (!imageUrl && !imageBase64) {
      return NextResponse.json({ 
        error: 'No image data provided. Provide either imageUrl or imageBase64.' 
      }, { status: 400 });
    }

    if (!SERPAPI_KEY) {
      console.error("SerpAPI key not configured");
      return NextResponse.json({ 
        error: 'SerpAPI key not configured. Please check your environment variables.' 
      }, { status: 500 });
    }

    console.log("Processing image recognition...");
    
    let finalImageUrl: string;
    
    // Handle base64 data
    if (imageBase64) {
      console.log("Detected base64 image, uploading to Cloudinary...");
      
      if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
        return NextResponse.json({
          error: 'Cloudinary not configured.',
          details: 'To process base64 images, configure Cloudinary in your environment variables.',
          suggestion: 'Add CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET to .env.local'
        }, { status: 400 });
      }
      
      try {
        // Validate base64 format
        if (!imageBase64.startsWith('data:image/')) {
          return NextResponse.json({
            error: 'Invalid image format',
            details: 'Expected base64 data URL starting with data:image/'
          }, { status: 400 });
        }
        
        finalImageUrl = await uploadToCloudinary(imageBase64);
        console.log("Image uploaded successfully to Cloudinary");
      } catch (uploadError) {
        console.error("Failed to upload image to Cloudinary:", uploadError);
        return NextResponse.json({
          error: 'Failed to upload image',
          details: uploadError instanceof Error ? uploadError.message : 'Unknown error',
          suggestion: 'Check your Cloudinary upload preset configuration'
        }, { status: 500 });
      }
    } else {
      // Use provided URL
      finalImageUrl = imageUrl;
      
      // Validate URL
      try {
        new URL(finalImageUrl);
      } catch (error) {
        return NextResponse.json({ 
          error: 'Invalid URL format provided.' 
        }, { status: 400 });
      }
    }

    console.log("Using image URL for SerpAPI:", finalImageUrl);
    
    // Call SerpAPI Google Lens
    const params = new URLSearchParams({
      engine: 'google_lens',
      api_key: SERPAPI_KEY,
      url: encodeURI(finalImageUrl),
      hl: 'en',
      // Optional: add type parameter for specific results
      // type: 'visual_matches' // 'all', 'products', 'exact_matches', 'visual_matches'
    });
    
    const serpapiUrl = `https://serpapi.com/search.json?${params.toString()}`;
    console.log("Calling SerpAPI Google Lens...");
    
    const serpResponse = await fetch(serpapiUrl, {
      method: 'GET',
      headers: { 
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; ProductRecognition/1.0)'
      },
      // Add timeout
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });
    
    console.log("SerpAPI response status:", serpResponse.status);
    
    const responseText = await serpResponse.text();
    
    if (!serpResponse.ok) {
      console.error("SerpAPI error response:", responseText.substring(0, 500));
      let errorMessage = `SerpAPI request failed with status ${serpResponse.status}`;
      
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.error) {
          errorMessage = `SerpAPI Error: ${errorData.error}`;
        }
      } catch {
        // Not JSON, use raw text
        if (responseText.includes('Invalid API key')) {
          errorMessage = 'Invalid SerpAPI key. Please check your API key.';
        }
      }
      
      throw new Error(errorMessage);
    }
    
    // Parse response
    let serpData;
    try {
      serpData = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse SerpAPI response as JSON");
      console.log("Response sample:", responseText.substring(0, 200));
      throw new Error("Invalid response from SerpAPI");
    }
    
    // Check for SerpAPI errors
    if (serpData.error) {
      console.error("SerpAPI returned error:", serpData.error);
      throw new Error(serpData.error);
    }
    
    // Check if search was successful
    if (serpData.search_metadata?.status !== 'Success') {
      console.warn("Search may not have completed successfully:", serpData.search_metadata?.status);
    }
    
    console.log("SerpAPI search successful. Found visual matches:", serpData.visual_matches?.length || 0);
    
    // Process the results
    const productInfo = processProductInfo(serpData);
    
    return NextResponse.json({
      success: true,
      ...productInfo,
      searchMetadata: {
        status: serpData.search_metadata?.status || 'Unknown',
        imageUrl: imageBase64 ? 'Uploaded to Cloudinary' : 'Provided URL',
        processedAt: new Date().toISOString()
      }
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Product recognition error:', error);
    
    // Handle specific errors
    let errorMessage = 'Failed to process image';
    let errorDetails = error instanceof Error ? error.message : 'Unknown error';
    let statusCode = 500;
    
    if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      errorMessage = 'Request timeout';
      errorDetails = 'The image recognition service took too long to respond.';
    } else if (error.message.includes('Invalid API key') || error.message.includes('invalid api_key')) {
      errorMessage = 'Invalid API key';
      errorDetails = 'Please check your SerpAPI key configuration.';
      statusCode = 401;
    } else if (error.message.includes('quota') || error.message.includes('limit')) {
      errorMessage = 'API limit reached';
      errorDetails = 'You may have exceeded your API request limit.';
      statusCode = 429;
    }
    
    return NextResponse.json({ 
      success: false,
      error: errorMessage, 
      details: errorDetails,
      suggestion: errorMessage === 'Failed to process image' 
        ? 'Check your API keys and ensure the image is accessible.'
        : undefined
    }, { 
      status: statusCode 
    });
  }
}

// Process SerpAPI response
function processProductInfo(serpData: any) {
  const result = {
    labels: [] as Array<{description: string; score: number; source?: string}>,
    objects: [] as Array<{name: string; score: number}>,
    logos: [] as Array<{description: string; score: number}>,
    productDetails: {
      title: null as string | null,
      price: null as string | null,
      currency: null as string | null,
      stores: [] as Array<{name: string; price?: string; link?: string; currency?: string}>,
      similarProducts: [] as Array<{title: string; source?: string; price?: string; thumbnail?: string; link?: string}>
    },
    visualMatches: [] as Array<any>,
    rawDataAvailable: !!serpData
  };
  
  // Process visual matches (primary source of information)
  if (serpData.visual_matches && Array.isArray(serpData.visual_matches)) {
    result.visualMatches = serpData.visual_matches;
    
    serpData.visual_matches.forEach((match: any, index: number) => {
      if (match.title) {
        // Add as label
        result.labels.push({
          description: match.title,
          score: Math.max(0.9 - (index * 0.05), 0.6), // Higher score for earlier results
          source: match.source
        });
        
        // Check if it looks like a product (has price or from shopping site)
        const isProduct = match.price || 
                         match.source?.toLowerCase().includes('amazon') ||
                         match.source?.toLowerCase().includes('ebay') ||
                         match.source?.toLowerCase().includes('walmart') ||
                         match.source?.toLowerCase().includes('shop') ||
                         match.source?.toLowerCase().includes('store');
        
        if (isProduct) {
          // First product becomes main product
          if (!result.productDetails.title && index === 0) {
            result.productDetails.title = match.title;
            result.productDetails.price = match.price?.value || null;
            result.productDetails.currency = match.price?.currency || null;
          }
          
          // Add to stores/shopping options
          if (match.source && match.price?.value) {
            result.productDetails.stores.push({
              name: match.source,
              price: match.price.value,
              link: match.link,
              currency: match.price.currency
            });
          }
          
          // Add to similar products
          if (index > 0) {
            result.productDetails.similarProducts.push({
              title: match.title,
              source: match.source,
              price: match.price?.value,
              thumbnail: match.thumbnail,
              link: match.link
            });
          }
        }
      }
    });
  }
  
  // Extract brand/logo from product titles
  const commonBrands = [
    'Apple', 'Samsung', 'Nike', 'Adidas', 'Sony', 'Microsoft', 'Google', 
    'Amazon', 'Dell', 'HP', 'Lenovo', 'Asus', 'LG', 'Canon', 'Nikon',
    'Gucci', 'Louis Vuitton', 'Chanel', 'Prada', 'Zara', 'H&M'
  ];
  
  if (result.productDetails.title) {
    const title = result.productDetails.title;
    for (const brand of commonBrands) {
      if (title.toLowerCase().includes(brand.toLowerCase())) {
        result.logos.push({
          description: brand,
          score: 0.9
        });
        break;
      }
    }
  }
  
  // Also check visual matches for brands
  if (serpData.visual_matches) {
    for (const match of serpData.visual_matches) {
      if (match.title) {
        for (const brand of commonBrands) {
          if (match.title.toLowerCase().includes(brand.toLowerCase()) && 
              !result.logos.some(logo => logo.description === brand)) {
            result.logos.push({
              description: brand,
              score: 0.8
            });
          }
        }
      }
    }
  }
  
  // Process related content as additional labels
  if (serpData.related_content && Array.isArray(serpData.related_content)) {
    serpData.related_content.forEach((content: any) => {
      if (content.query && content.query.length > 3) {
        result.labels.push({
          description: content.query,
          score: 0.7
        });
      }
    });
  }
  
  return result;
}

// GET endpoint for API information
export async function GET(request: NextRequest) {
  const isConfigured = !!(SERPAPI_KEY && CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET);
  
  return NextResponse.json({
    service: 'Product Recognition API',
    status: isConfigured ? 'Configured' : 'Not fully configured',
    endpoints: {
      POST: '/api/product-recognition',
      description: 'Recognize products from images using Google Lens via SerpAPI',
      parameters: {
        imageUrl: 'Publicly accessible image URL (optional)',
        imageBase64: 'Base64 data URL (optional, requires Cloudinary configuration)'
      }
    },
    configuration: {
      serpapi: !!SERPAPI_KEY,
      cloudinary: !!(CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET),
      note: !isConfigured ? 'Check your environment variables' : 'Ready to process images'
    }
  });
}