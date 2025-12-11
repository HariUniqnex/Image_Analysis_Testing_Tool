import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, imageBase64 } = await request.json()

    if (!imageUrl && !imageBase64) {
      return NextResponse.json({ error: "Image URL or base64 is required" }, { status: 400 })
    }

    const apiKey = process.env.REMOVE_BG_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Remove.bg API key not configured" }, { status: 500 })
    }

    const formData = new FormData()

    if (imageUrl) {
      formData.append("image_url", imageUrl)
    } else if (imageBase64) {
      // Extract base64 data without the data URL prefix
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "")
      formData.append("image_file_b64", base64Data)
    }

    formData.append("size", "auto")

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ error: `Remove.bg API error: ${errorText}` }, { status: response.status })
    }

    const arrayBuffer = await response.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString("base64")
    const resultUrl = `data:image/png;base64,${base64}`

    return NextResponse.json({ resultUrl, success: true })
  } catch (error) {
    console.error("Remove.bg error:", error)
    return NextResponse.json({ error: "Failed to process image" }, { status: 500 })
  }
}
