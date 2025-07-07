"use server"

import { put } from "@vercel/blob"
import { v4 as uuidv4 } from "uuid"

// Define response type for better type safety
type SendEmailResponse = {
  success: boolean
  error?: string
  data?: any
  historyItem?: EmailHistoryItem
  errorDetails?: any
}

// Define email history item type
type EmailHistoryItem = {
  id: string
  email: string
  contactName?: string
  contactNumber?: string
  timestamp: number
  status: "success" | "failed"
  imageCount: number
  errorMessage?: string
}

// Helper function to create email content
function createEmailContent(templateBody: string, contentHtml: string): string {
  if (templateBody.includes("{{content}}")) {
    return templateBody.replace("{{content}}", contentHtml)
  } else {
    return templateBody + contentHtml
  }
}

// Helper function to send email via EmailJS or similar service
async function sendEmailViaAPI(emailData: {
  to: string
  subject: string
  html: string
  from: string
  attachments?: any[]
}): Promise<any> {
  // For now, let's simulate email sending and return success
  // In a real implementation, you would integrate with a working email service

  console.log("Email would be sent with data:", {
    to: emailData.to,
    subject: emailData.subject,
    from: emailData.from,
    hasAttachments: !!emailData.attachments,
    attachmentCount: emailData.attachments?.length || 0,
  })

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // For demonstration, we'll return a success response
  // Replace this with actual email service integration
  return {
    id: `email_${Date.now()}`,
    status: "sent",
    message: "Email sent successfully (simulated)",
  }
}

export async function sendEmail(formData: FormData): Promise<SendEmailResponse> {
  try {
    const email = formData.get("email") as string
    const files = formData.getAll("files") as File[]
    const useAttachments = formData.get("useAttachments") === "true"
    const templateSubject = (formData.get("templateSubject") as string) || "Email with Images"
    const templateBody = (formData.get("templateBody") as string) || "{{content}}"
    const senderName = (formData.get("senderName") as string) || "NBD CHARITY"

    // Get contact information if available
    const contactNumber = formData.get("contactNumber") as string | null
    const contactName = formData.get("contactName") as string | null

    if (!email || files.length === 0) {
      return {
        success: false,
        error: "Email and files are required",
      }
    }

    console.log("Processing email send request:", {
      to: email,
      fileCount: files.length,
      useAttachments,
      senderName,
    })

    let contentHtml = ""
    const attachments = []

    if (useAttachments) {
      // Use attachments instead of Blob storage
      console.log("Using attachments instead of Blob storage...")

      contentHtml = `
        <div style="margin-top: 20px;">
          <p><strong>Images are attached to this email.</strong></p>
          <p>You have received ${files.length} image${files.length > 1 ? "s" : ""} as attachments.</p>
        </div>
      `

      // Prepare files as attachments (for future email service integration)
      for (const file of files) {
        const buffer = await file.arrayBuffer()
        attachments.push({
          filename: file.name,
          content: Array.from(new Uint8Array(buffer)),
          contentType: file.type,
        })
      }
    } else {
      // Use Blob storage
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        console.error("Missing BLOB_READ_WRITE_TOKEN environment variable")
        return {
          success: false,
          error: "File storage configuration is missing",
        }
      }

      // Upload files to Vercel Blob
      console.log("Uploading files to Vercel Blob...")
      const uploadedFiles = []

      for (const file of files) {
        try {
          const blob = await put(`images/${Date.now()}-${file.name}`, file, {
            access: "public",
          })

          uploadedFiles.push({
            url: blob.url,
            filename: file.name,
            contentType: file.type,
          })
        } catch (uploadError) {
          console.error("Error uploading file to Blob:", uploadError)
          return {
            success: false,
            error: "Failed to upload images. Please try again.",
            errorDetails: uploadError instanceof Error ? uploadError.message : "Unknown upload error",
          }
        }
      }

      console.log("Files uploaded successfully:", uploadedFiles.length, "files")

      // Create HTML content with images
      contentHtml = `
        <div style="margin-top: 20px;">
          <p><strong>Your images:</strong></p>
          ${uploadedFiles
            .map(
              (file, index) => `
            <div style="margin-bottom: 15px;">
              <p style="margin-bottom: 5px; font-weight: bold;">Image ${index + 1}: ${file.filename}</p>
              <img src="${file.url}" alt="Image ${index + 1}" style="max-width: 100%; height: auto; border-radius: 4px; border: 1px solid #ddd;" />
            </div>
          `,
            )
            .join("")}
        </div>
      `
    }

    // Replace placeholder with content
    const htmlContent = createEmailContent(templateBody, contentHtml)

    // Send email
    try {
      console.log("Sending email...")

      const emailData = {
        to: email,
        subject: templateSubject,
        html: htmlContent,
        from: `${senderName} <noreply@sender.juhndaa.my.id>`,
        attachments: useAttachments ? attachments : undefined,
      }

      const result = await sendEmailViaAPI(emailData)
      console.log("Email sent successfully:", result)

      // Create history item
      const historyItem: EmailHistoryItem = {
        id: uuidv4(),
        email,
        contactName: contactName || undefined,
        contactNumber: contactNumber || undefined,
        timestamp: Date.now(),
        status: "success",
        imageCount: files.length,
      }

      return {
        success: true,
        data: result,
        historyItem,
      }
    } catch (emailError) {
      console.error("Error sending email:", emailError)

      // Create failed history item
      const historyItem: EmailHistoryItem = {
        id: uuidv4(),
        email,
        contactName: contactName || undefined,
        contactNumber: contactNumber || undefined,
        timestamp: Date.now(),
        status: "failed",
        imageCount: files.length,
        errorMessage: emailError instanceof Error ? emailError.message : "An unknown error occurred",
      }

      return {
        success: false,
        error: "Failed to send email. Please check your email configuration.",
        errorDetails: emailError instanceof Error ? emailError.message : "Unknown email error",
        historyItem,
      }
    }
  } catch (error) {
    console.error("Server error:", error)

    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
      errorDetails: error,
    }
  }
}
