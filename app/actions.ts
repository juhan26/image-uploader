"use server"

import { put } from "@vercel/blob"
import nodemailer from "nodemailer"
import { v4 as uuidv4 } from "uuid"
import { emailConfig } from "./config/email"

// Define response type for better type safety
type SendEmailResponse = {
  success: boolean
  error?: string
  data?: any
  historyItem?: EmailHistoryItem
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

    // Get contact information if available
    const contactNumber = formData.get("contactNumber") as string | null
    const contactName = formData.get("contactName") as string | null

    // Create contact display text
    const contactDisplay =
      contactNumber && contactName ? `#${contactNumber} - ${contactName}` : "NBD CHARITY - Zakat Al fitri 2025"

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

      contentHtml = `<p>Les images sont jointes à cet email.</p>`

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
      // Use Blob storage (original method)
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
              <img src="${file.url}" alt="${contactDisplay}" style="max-width: 100%; border-radius: 4px;" />
              <p style="margin-top: 5px; color: #666;">${contactDisplay}</p>
            </div>
          `,
            )
            .join("")}
        </div>
        <p style="margin-top: 30px; color: #666;">You can also download the images directly from the links above.</p>
      `
    }

    // Get email template and replace content placeholder
    const htmlContent = emailConfig.templates.default.body.replace("{{content}}", contentHtml)

    // Create a transporter using Hostinger SMTP (tetap menggunakan konfigurasi yang sama)
    const transporter = nodemailer.createTransport({
      host: "smtp.hostinger.com", // Hostinger SMTP server
      port: 465, // SSL port
      secure: true, // Use SSL
      auth: {
        user: process.env.HOSTINGER_EMAIL, // Tetap menggunakan HOSTINGER_EMAIL
        pass: process.env.HOSTINGER_PASSWORD, // Tetap menggunakan HOSTINGER_PASSWORD
      },
    })

    // Send email using Nodemailer
    console.log("Sending email via Hostinger...")
    const mailOptions = {
      from: `"${emailConfig.senderName}" <${process.env.HOSTINGER_EMAIL}>`, // Tetap menggunakan HOSTINGER_EMAIL
      to: email,
      subject: contactDisplay, // Use contact info in subject line too
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
  } catch (error) {
    console.error("Server error:", error)

    // Create failed history item
    const historyItem: EmailHistoryItem = {
      id: uuidv4(),
      email: formData.get("email") as string,
      contactName: (formData.get("contactName") as string) || undefined,
      contactNumber: (formData.get("contactNumber") as string) || undefined,
      timestamp: Date.now(),
      status: "failed",
      imageCount: (formData.getAll("files") as File[]).length,
      errorMessage: error instanceof Error ? error.message : "An unknown error occurred",
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
      historyItem,
    }
  }
}
