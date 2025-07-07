export async function GET() {
  try {
    // Test if environment variables are properly set
    const hasHostingerEmail = !!process.env.HOSTINGER_EMAIL
    const hasHostingerPassword = !!process.env.HOSTINGER_PASSWORD
    const hasBlobToken = !!process.env.BLOB_READ_WRITE_TOKEN

    return Response.json({
      success: true,
      environment: {
        hasHostingerEmail,
        hasHostingerPassword,
        hasBlobToken,
        hostingerEmail: process.env.HOSTINGER_EMAIL ? process.env.HOSTINGER_EMAIL.substring(0, 10) + "..." : "Not set",
      },
      message: "Environment variables check completed",
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
