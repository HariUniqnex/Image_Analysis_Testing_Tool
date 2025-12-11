// app/api/cloudinary-validate/route.ts - REAL VALIDATION using Admin API
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, operations = {} } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'Cloudinary credentials not configured' },
        { status: 500 }
      );
    }

    // Extract public ID from Cloudinary URL or handle external URLs
    let publicId = '';
    let isExternal = false;
    
    if (imageUrl.includes('cloudinary.com')) {
      // Cloudinary URL - extract public ID
      const matches = imageUrl.match(/upload\/(?:v\d+\/)?([^\.]+)/);
      publicId = matches ? matches[1] : '';
    } else {
      // External URL - we need to upload it first to analyze
      isExternal = true;
      
      // Upload external image to Cloudinary for analysis
      const uploadResult = await uploadExternalImage(imageUrl, cloudName, apiKey, apiSecret);
      publicId = uploadResult.public_id;
    }

    if (!publicId) {
      return NextResponse.json(
        { error: 'Could not process image URL' },
        { status: 400 }
      );
    }

    // Get REAL image data using Admin API
    const imageData = await getCloudinaryImageData(publicId, cloudName, apiKey, apiSecret);
    
    if (!imageData) {
      return NextResponse.json(
        { error: 'Could not retrieve image data from Cloudinary' },
        { status: 404 }
      );
    }

    // Build transformation URL with requested operations
    const transformations = buildTransformations(operations);
    const transformString = transformations.join(',');
    const resultUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${transformString}/${publicId}`;

    // Analyze the REAL image data
    const analysis = analyzeImageData(imageData);

    return NextResponse.json({
      success: true,
      resultUrl: resultUrl,
      validation: analysis.validation,
      metadata: analysis.metadata,
      rawData: imageData // Include raw Cloudinary data for debugging
    });

  } catch (error) {
    console.error('Cloudinary validation error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Validation failed',
        suggestion: 'Make sure your image URL is accessible and Cloudinary credentials are correct'
      },
      { status: 500 }
    );
  }
}

// Upload external image to Cloudinary
async function uploadExternalImage(
  imageUrl: string, 
  cloudName: string, 
  apiKey: string, 
  apiSecret: string
) {
  const timestamp = Math.round(Date.now() / 1000);
  
  // Generate signature
  const signature = crypto
    .createHash('sha256')
    .update(`timestamp=${timestamp}${apiSecret}`)
    .digest('hex');

  const formData = new FormData();
  formData.append('file', imageUrl);
  formData.append('timestamp', timestamp.toString());
  formData.append('api_key', apiKey);
  formData.append('signature', signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: 'POST',
      body: formData
    }
  );

  if (!response.ok) {
    throw new Error('Failed to upload image to Cloudinary');
  }

  return await response.json();
}

// Get image data from Cloudinary Admin API
async function getCloudinaryImageData(
  publicId: string,
  cloudName: string,
  apiKey: string,
  apiSecret: string
) {
  // Create basic auth header
  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
  
  // Cloudinary Admin API endpoint
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/resources/image/upload/${encodeURIComponent(publicId)}?colors=true&image_metadata=true&quality_analysis=true`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Basic ${auth}`
    }
  });

  if (!response.ok) {
    console.error('Cloudinary API error:', response.status, await response.text());
    return null;
  }

  return await response.json();
}

// Build transformation array
function buildTransformations(operations: any): string[] {
  const transformations = [];
  
  if (operations.resize || operations.crop) {
    const width = operations.resize?.width || 1200;
    const height = operations.resize?.height || 1200;
    const crop = operations.crop ? 'fill' : 'fit';
    
    transformations.push(`c_${crop}`);
    transformations.push(`w_${width}`);
    transformations.push(`h_${height}`);
  }
  
  if (operations.quality) {
    transformations.push(`q_${operations.quality}`);
  } else {
    transformations.push('q_auto:good');
  }
  
  if (operations.format) {
    transformations.push(`f_${operations.format}`);
  } else {
    transformations.push('f_auto');
  }
  
  if (operations.background === 'remove') {
    transformations.push('e_background_removal');
  }
  
  if (operations.background === 'white') {
    transformations.push('b_white');
  }
  
  return transformations;
}

// Analyze real Cloudinary image data
function analyzeImageData(imageData: any) {
  const width = imageData.width || 0;
  const height = imageData.height || 0;
  const format = imageData.format?.toLowerCase() || '';
  const fileSize = imageData.bytes || 0;
  const aspectRatio = width && height ? width / height : 0;
  
  // Real quality metrics from Cloudinary
  const qualityAnalysis = imageData.quality_analysis || {};
  const colors = imageData.colors || [];
  
  // Calculate quality score based on REAL data
  let qualityScore = 0.8;
  const issues = [];
  
  // Aspect ratio checks
  const isSquare = aspectRatio >= 0.95 && aspectRatio <= 1.05;
  if (!isSquare) {
    issues.push({
      type: 'composition',
      severity: 'medium',
      message: `Aspect ratio ${aspectRatio.toFixed(2)}:1 - not square (e-commerce standard is 1:1)`,
      suggestion: 'Crop to square format for better display'
    });
    qualityScore -= 0.1;
  }
  
  // Dimension checks
  const isStandardSize = width >= 800 && height >= 800;
  if (!isStandardSize) {
    issues.push({
      type: 'dimensions',
      severity: width < 800 || height < 800 ? 'high' : 'medium',
      message: `Dimensions ${width}x${height}px - below recommended 800x800 minimum`,
      suggestion: 'Resize to at least 800x800 pixels'
    });
    qualityScore -= width < 800 || height < 800 ? 0.15 : 0.05;
  }
  
  // File size checks
  const isOptimizedSize = fileSize > 0 && fileSize < 5 * 1024 * 1024;
  if (!isOptimizedSize) {
    issues.push({
      type: 'size',
      severity: fileSize > 10 * 1024 * 1024 ? 'high' : 'medium',
      message: `File size ${formatSize(fileSize)} - ${fileSize > 10 * 1024 * 1024 ? 'too large' : 'could be optimized'}`,
      suggestion: 'Compress image for web delivery'
    });
    qualityScore -= fileSize > 10 * 1024 * 1024 ? 0.15 : 0.05;
  }
  
  // Format checks
  const isWebFriendly = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(format);
  if (!isWebFriendly) {
    issues.push({
      type: 'format',
      severity: 'medium',
      message: `Format ${format.toUpperCase()} - not optimal for web`,
      suggestion: 'Convert to WebP or JPEG format'
    });
    qualityScore -= 0.1;
  }
  
  // Use Cloudinary's quality analysis if available
  if (qualityAnalysis.focus) {
    const focusScore = qualityAnalysis.focus;
    if (focusScore < 0.5) {
      issues.push({
        type: 'quality',
        severity: 'medium',
        message: 'Image may be out of focus or blurry',
        suggestion: 'Use a sharper image for better product presentation'
      });
      qualityScore -= 0.1;
    }
  }
  
  if (qualityAnalysis.noise && qualityAnalysis.noise > 0.7) {
    issues.push({
      type: 'quality',
      severity: 'low',
      message: 'High noise detected in image',
      suggestion: 'Consider using a cleaner source image'
    });
    qualityScore -= 0.05;
  }
  
  // Color palette analysis
  if (colors.length > 20) {
    issues.push({
      type: 'colors',
      severity: 'low',
      message: `Complex color palette (${colors.length} colors)`,
      suggestion: 'Consider simplifying colors for better loading'
    });
  }
  
  // Clamp score
  qualityScore = Math.max(0.3, Math.min(0.95, qualityScore));
  
  // Compliance checks
  const complianceChecks = [
    {
      check: 'Square format (1:1 ratio)',
      passed: isSquare,
      details: isSquare ? '✓ Perfect' : `${aspectRatio.toFixed(2)}:1 ratio`
    },
    {
      check: 'Minimum dimensions (800x800px)',
      passed: isStandardSize,
      details: isStandardSize ? '✓ Good' : `${width}x${height}px`
    },
    {
      check: 'Web-optimized format',
      passed: isWebFriendly,
      details: isWebFriendly ? format.toUpperCase() : `${format.toUpperCase()} (use WebP/JPEG)`
    },
    {
      check: 'File size optimization',
      passed: isOptimizedSize,
      details: isOptimizedSize ? formatSize(fileSize) : `${formatSize(fileSize)} (too large)`
    }
  ];
  
  const passedChecks = complianceChecks.filter(c => c.passed).length;
  
  return {
    validation: {
      quality: {
        score: qualityScore,
        issues: issues,
        cloudinaryAnalysis: qualityAnalysis // Include Cloudinary's native analysis
      },
      compliance: {
        passed: passedChecks >= Math.ceil(complianceChecks.length * 0.75),
        checks: complianceChecks
      }
    },
    metadata: {
      width: width,
      height: height,
      format: format,
      file_size: fileSize,
      aspect_ratio: aspectRatio.toFixed(2),
      colors: colors.slice(0, 5),
      resource_type: imageData.resource_type,
      created_at: imageData.created_at,
      url: imageData.secure_url
    }
  };
}

function formatSize(bytes: number): string {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}