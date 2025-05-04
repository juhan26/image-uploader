"use server"

import { put } from "@vercel/blob"
import nodemailer from "nodemailer"
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

export async function sendEmail(formData: FormData): Promise<SendEmailResponse> {
  try {
    const email = formData.get("email") as string
    const files = formData.getAll("files") as File[]
    const useAttachments = formData.get("useAttachments") === "true"
    const templateSubject = (formData.get("templateSubject") as string) || "Email with Images"
    const templateBody = (formData.get("templateBody") as string) || "{{content}}"

    // Get contact information if available
    const contactNumber = formData.get("contactNumber") as string | null
    const contactName = formData.get("contactName") as string | null

    if (!email || files.length === 0) {
      return {
        success: false,
        error: "Email and files are required",
      }
    }

    // Check environment variables
    if (!process.env.HOSTINGER_EMAIL || !process.env.HOSTINGER_PASSWORD) {
      console.error("Missing Hostinger email credentials")
      return {
        success: false,
        error: "Email service configuration is missing",
      }
    }

    let contentHtml = ""
    const attachments = []

    if (useAttachments) {
      // Use attachments instead of Blob storage
      console.log("Using attachments instead of Blob storage...")

      contentHtml = `<p>Images are attached to this email.</p>`

      // Add files as attachments
      for (const file of files) {
        const buffer = await file.arrayBuffer()
        attachments.push({
          filename: file.name,
          content: Buffer.from(buffer),
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

      console.log("Files uploaded successfully:", uploadedFiles)

      // Create HTML content with images
      contentHtml = `
        <div style="margin-top: 20px;">
          ${uploadedFiles
            .map(
              (file) => `
            <div style="margin-bottom: 15px;">
              <img src="${file.url}" alt="Image" style="max-width: 100%; border-radius: 4px;" />
            </div>
          `,
            )
            .join("")}
        </div>
      `
    }

    // Replace placeholder with content
    let htmlContent = templateBody
    if (templateBody.includes("{{content}}")) {
      htmlContent = templateBody.replace("{{content}}", contentHtml)
    } else {
      htmlContent = templateBody + contentHtml
    }

    // Create a transporter using Hostinger SMTP
    try {
      const transporter = nodemailer.createTransport({
        host: "smtp.hostinger.com",
        port: 465,
        secure: true,
        auth: {
          user: process.env.HOSTINGER_EMAIL,
          pass: process.env.HOSTINGER_PASSWORD,
        },
      })

      // Send email using Nodemailer
      console.log("Sending email via Hostinger...")
      const mailOptions = {
        from: `"Email Sender" <${process.env.HOSTINGER_EMAIL}>`,
        to: email,
        subject: templateSubject,
        html: htmlContent,
        attachments: attachments,
      }

      const info = await transporter.sendMail(mailOptions)
      console.log("Email sent successfully:", info)

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
        data: info,
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
