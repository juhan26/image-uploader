"use server"

import { put } from "@vercel/blob"
import { v4 as uuidv4 } from "uuid"
import nodemailer from "nodemailer"

// export const runtime = "nodejs" // Dihapus: Tidak diizinkan di file "use server"
// export const dynamic = "force-dynamic" // Dihapus: Tidak diizinkan di file "use server"

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

// Helper function to send email via Nodemailer (Hostinger SMTP)
async function sendEmailViaAPI(emailData: {
  to: string
  subject: string
  html: string
  from: string
  attachments?: { filename: string; content: Buffer; contentType: string }[] // Update attachment type
}): Promise<any> {
  // Pastikan variabel lingkungan tersedia
  if (!process.env.HOSTINGER_EMAIL || !process.env.HOSTINGER_PASSWORD) {
    throw new Error("Hostinger email credentials are not set in environment variables.")
  }

  // Buat transporter Nodemailer menggunakan SMTP Hostinger
  const transporter = nodemailer.createTransport({
    host: "smtp.hostinger.com", // Host SMTP Hostinger
    port: 465, // Port SSL
    secure: true, // Gunakan SSL
    auth: {
      user: process.env.HOSTINGER_EMAIL,
      pass: process.env.HOSTINGER_PASSWORD,
    },
  })

  // Siapkan lampiran untuk Nodemailer
  const nodemailerAttachments = emailData.attachments?.map((att) => ({
    filename: att.filename,
    content: att.content, // Nodemailer expects Buffer for content
    contentType: att.contentType,
  }))

  // Kirim email
  const mailOptions = {
    from: emailData.from,
    to: emailData.to,
    subject: emailData.subject,
    html: emailData.html,
    attachments: nodemailerAttachments,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log("Email sent: %s", info.messageId)
    return {
      id: info.messageId,
      status: "sent",
      message: "Email sent successfully",
    }
  } catch (error) {
    console.error("Error sending email with Nodemailer:", error)
    throw new Error(`Failed to send email: ${error instanceof Error ? error.message : "Unknown error"}`)
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
    const attachments: { filename: string; content: Buffer; contentType: string }[] = []

    const imageCount = files.filter((f) => f.type.startsWith("image/")).length
    const videoCount = files.filter((f) => f.type.startsWith("video/")).length
    const totalCount = files.length

    if (useAttachments) {
      console.log("Using attachments instead of Blob storage...")

      let countDetails = ""
      if (imageCount > 0 && videoCount > 0) {
        countDetails = `${imageCount} image${imageCount > 1 ? "s" : ""} and ${videoCount} video${videoCount > 1 ? "s" : ""}`
      } else if (imageCount > 0) {
        countDetails = `${imageCount} image${imageCount > 1 ? "s" : ""}`
      } else if (videoCount > 0) {
        countDetails = `${videoCount} video${videoCount > 1 ? "s" : ""}`
      } else {
        countDetails = `${totalCount} file${totalCount > 1 ? "s" : ""}`
      }

      contentHtml = `
        <div style="margin-top: 20px; font-family: 'Inter Tight', 'Inter', Helvetica, Arial, sans-serif;">
          <p><strong>Files are attached to this email.</strong></p>
          <p>You have received ${countDetails} as attachments.</p>
        </div>
      `

      for (const file of files) {
        const buffer = await file.arrayBuffer()
        attachments.push({
          filename: file.name,
          content: Buffer.from(buffer),
          contentType: file.type,
        })
      }
    } else {
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        console.error("Missing BLOB_READ_WRITE_TOKEN environment variable")
        return {
          success: false,
          error: "File storage configuration is missing",
        }
      }

      console.log("Uploading files to Vercel Blob...")
      const uploadedFiles = []

      for (const file of files) {
        try {
          const blob = await put(`media/${Date.now()}-${file.name}`, file, {
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
            error: "Failed to upload files. Please try again.",
            errorDetails: uploadError instanceof Error ? uploadError.message : "Unknown upload error",
          }
        }
      }

      console.log("Files uploaded successfully:", uploadedFiles.length, "files")

      contentHtml = `
        <div style="margin-top: 20px; font-family: 'Inter Tight', 'Inter', Helvetica, Arial, sans-serif;">
          <p style="font-size: 16px; font-weight: bold; margin-bottom: 15px;">Your uploaded media:</p>
          ${uploadedFiles
            .map((file, index) => {
              const isVideo = file.contentType?.startsWith("video/")
              if (isVideo) {
                return `
                  <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #eee; border-radius: 8px; background-color: #fcfcfc;">
                    <p style="margin-top: 0; margin-bottom: 10px; font-weight: bold; font-size: 14px; color: #222;">
                      Video ${index + 1}: ${file.filename}
                    </p>
                    <div style="margin-bottom: 12px;">
                      <video src="${file.url}" controls style="max-width: 100%; max-height: 400px; border-radius: 6px; border: 1px solid #ddd; background-color: #000;">
                        Your browser does not support the video tag.
                      </video>
                    </div>
                    <p style="margin: 0; font-size: 13px;">
                      <a href="${file.url}" download="${file.filename}" target="_blank" style="display: inline-block; padding: 8px 16px; background-color: #0f172a; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 13px;">
                        Download / Watch Video
                      </a>
                    </p>
                  </div>
                `
              } else {
                return `
                  <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #eee; border-radius: 8px; background-color: #fcfcfc;">
                    <p style="margin-top: 0; margin-bottom: 10px; font-weight: bold; font-size: 14px; color: #222;">
                      Image ${index + 1}: ${file.filename}
                    </p>
                    <div>
                      <img src="${file.url}" alt="Image ${index + 1}" style="max-width: 100%; height: auto; border-radius: 6px; border: 1px solid #ddd;" />
                    </div>
                  </div>
                `
              }
            })
            .join("")}
        </div>
      `
    }

    const htmlContent = createEmailContent(templateBody, contentHtml)

    try {
      console.log("Sending email...")

      const emailData = {
        to: email,
        subject: templateSubject,
        html: htmlContent,
        from: `${senderName} <${process.env.HOSTINGER_EMAIL}>`,
        attachments: useAttachments ? attachments : undefined,
      }

      const result = await sendEmailViaAPI(emailData)
      console.log("Email sent successfully:", result)

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
