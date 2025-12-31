import { type NextRequest, NextResponse } from "next/server"

/**
 * Next.js API Route - Chat Endpoint
 * 
 * This route acts as a proxy between the frontend and the Cloudflare Worker.
 * It forwards chat messages to the Worker and returns the AI responses.
 * 
 * You can also bypass this route and call the Worker directly from the frontend.
 */

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json()

    // Get the Cloudflare Worker URL from environment variables
    // Defaults to localhost for development
    const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL || 'http://localhost:8787'

    // Forward the request to the Cloudflare Worker
    const response = await fetch(`${workerUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        userId: 'default-user', // You can make this dynamic based on your auth system
      }),
    })

    if (!response.ok) {
      throw new Error(`Worker responded with status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      { 
        error: "Failed to process chat message",
        details: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    )
  }
}
