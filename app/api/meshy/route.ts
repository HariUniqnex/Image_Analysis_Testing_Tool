import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { imageUrl, imageBase64 } = body

    if (!imageUrl && !imageBase64) {
      return NextResponse.json({ error: "Image URL or base64 is required" }, { status: 400 })
    }

    const apiKey = process.env.MESHY_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Meshy API key not configured" }, { status: 500 })
    }

    const imageSource = imageUrl || imageBase64

    const createResponse = await fetch("https://api.meshy.ai/openapi/v1/image-to-3d", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: imageSource,
        enable_pbr: true,
        should_remesh: true,
        should_texture: true,
      }),
    })

    if (!createResponse.ok) {
      const errorText = await createResponse.text()
      return NextResponse.json({ error: `Meshy API error: ${errorText}` }, { status: createResponse.status })
    }

    const createData = await createResponse.json()
    const taskId = createData.result

    // Poll for task completion
    let attempts = 0
    const maxAttempts = 60

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 5000))

      const statusResponse = await fetch(`https://api.meshy.ai/openapi/v1/image-to-3d/${taskId}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })

      if (!statusResponse.ok) {
        attempts++
        continue
      }

      const statusData = await statusResponse.json()

      if (statusData.status === "SUCCEEDED") {
        return NextResponse.json({
          success: true,
          taskId,
          modelUrl: statusData.model_urls?.glb,
          thumbnailUrl: statusData.thumbnail_url,
          status: "SUCCEEDED",
        })
      } else if (statusData.status === "FAILED") {
        return NextResponse.json({ error: "Meshy processing failed" }, { status: 500 })
      }

      attempts++
    }

    return NextResponse.json({
      success: true,
      taskId,
      status: "PENDING",
      message: "Task is still processing. Use the task ID to check status.",
    })
  } catch (error) {
    console.error("Meshy error:", error)
    return NextResponse.json({ error: "Failed to process image" }, { status: 500 })
  }
}
