import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { recipient, subject, imageUrls, sendAsAttachment } = await request.json()

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; text-align: center;">${subject}</h2>
        <p>Dear ${recipient.name},</p>
        <p>We are pleased to share these images with you.</p>
        
        ${
          !sendAsAttachment
            ? `
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin: 20px 0;">
            ${imageUrls
              .map(
                (url: string) => `
              <img src="${url}" alt="Shared image" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;" />
            `,
              )
              .join("")}
          </div>
        `
            : "<p>Please find the attached images.</p>"
        }
        
        <p>Best regards,<br>NBD Charity Team</p>
      </div>
    `

    const emailData: any = {
      from: process.env.HOSTINGER_EMAIL || "noreply@example.com",
      to: recipient.email,
      subject: subject,
      html: emailHtml,
    }

    // Add attachments if sending as attachment
    if (sendAsAttachment) {
      emailData.attachments = await Promise.all(
        imageUrls.map(async (url: string, index: number) => {
          const response = await fetch(url)
          const buffer = await response.arrayBuffer()
          return {
            filename: `image-${index + 1}.jpg`,
            content: Buffer.from(buffer),
          }
        }),
      )
    }

    await resend.emails.send(emailData)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error sending bulk email:", error)
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }
}
