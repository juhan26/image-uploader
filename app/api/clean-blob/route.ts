import { list, del } from "@vercel/blob"

export async function GET() {
  try {
    // Dapatkan daftar semua file dalam Blob storage
    const { blobs } = await list()

    if (blobs.length === 0) {
      return Response.json({
        success: true,
        message: "No files to delete",
        deletedCount: 0,
      })
    }

    // Hapus semua file
    const deletePromises = blobs.map((blob) => del(blob.url))
    await Promise.all(deletePromises)

    return Response.json({
      success: true,
      message: `Successfully deleted ${blobs.length} files`,
      deletedCount: blobs.length,
    })
  } catch (error) {
    console.error("Error cleaning Blob storage:", error)
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
