import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, imageBase64, features = ["LABEL_DETECTION", "OBJECT_LOCALIZATION"] } = await request.json()

    if (!imageUrl && !imageBase64) {
      return NextResponse.json({ error: "Image URL or base64 is required" }, { status: 400 })
    }

    const apiKey = process.env.GOOGLE_CLOUD_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Google Cloud API key not configured" }, { status: 500 })
    }

    // Build the image source
    const imageSource: Record<string, string> = {}
    if (imageUrl) {
      imageSource.source = JSON.stringify({ imageUri: imageUrl })
    } else if (imageBase64) {
      // Extract base64 data without the data URL prefix
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "")
      imageSource.content = base64Data
    }

    // Build features array
    const featureRequests = features.map((type: string) => ({
      type,
      maxResults: 10,
    }))

    const requestBody = {
      requests: [
        {
          image: imageUrl
            ? { source: { imageUri: imageUrl } }
            : { content: imageBase64.replace(/^data:image\/\w+;base64,/, "") },
          features: featureRequests,
        },
      ],
    }

    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ error: `Google Vision API error: ${errorText}` }, { status: response.status })
    }

    const data = await response.json()
    const result = data.responses?.[0]

    return NextResponse.json({
      success: true,
      labels: result?.labelAnnotations || [],
      objects: result?.localizedObjectAnnotations || [],
      text: result?.textAnnotations || [],
      faces: result?.faceAnnotations || [],
      raw: result,
    })
  } catch (error) {
    console.error("Google Vision error:", error)
    return NextResponse.json({ error: "Failed to analyze image" }, { status: 500 })
  }
}
