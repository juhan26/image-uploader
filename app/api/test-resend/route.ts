export async function GET() {
  try {
    const apiKey = process.env.RESEND_API_KEY

    if (!apiKey) {
      return Response.json(
        {
          success: false,
          error: "No RESEND_API_KEY found in environment variables",
        },
        { status: 500 },
      )
    }

    // Test the API key with a simple request to get domains
    const response = await fetch("https://api.resend.com/domains", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })

    const data = await response.json()

    return Response.json({
      success: response.ok,
      status: response.status,
      apiKeyFormat: {
        hasKey: !!apiKey,
        keyLength: apiKey.length,
        keyPrefix: apiKey.substring(0, 3),
        startsWithRe: apiKey.startsWith("re_"),
      },
      data: response.ok ? data : undefined,
      error: !response.ok ? data : undefined,
    })
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
