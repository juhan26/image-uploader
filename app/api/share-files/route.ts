import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { recipientEmails, files, senderEmail, message } = await request.json()

    if (!recipientEmails || !Array.isArray(recipientEmails) || recipientEmails.length === 0) {
      return NextResponse.json({ error: "Recipient emails are required" }, { status: 400 })
    }

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: "Files are required" }, { status: 400 })
    }

    // Create file list for email
    const fileList = files
      .map(
        (file: any) => `
        <div style="margin: 10px 0; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <img src="${file.url}" alt="${file.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;" />
            <div>
              <h4 style="margin: 0; font-size: 14px; font-weight: 600; color: #1e293b;">${file.name}</h4>
              <p style="margin: 5px 0 0 0; font-size: 12px; color: #64748b;">${(file.size / 1024 / 1024).toFixed(2)} MB</p>
              <a href="${file.url}" target="_blank" style="color: #059669; text-decoration: none; font-size: 12px; font-weight: 500;">Lihat Gambar →</a>
            </div>
          </div>
        </div>
      `,
      )
      .join("")

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #059669; margin: 0; font-size: 24px;">CloudShare</h1>
          <p style="color: #64748b; margin: 10px 0 0 0;">File Sharing Platform</p>
        </div>
        
        <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h2 style="color: #1e293b; margin: 0 0 15px 0; font-size: 20px;">Seseorang membagikan file dengan Anda</h2>
          
          <p style="color: #475569; margin: 0 0 20px 0; line-height: 1.6;">
            <strong>${senderEmail}</strong> telah membagikan ${files.length} file dengan Anda melalui CloudShare.
          </p>

          ${
            message
              ? `
            <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="margin: 0 0 10px 0; color: #1e293b; font-size: 14px;">Pesan:</h4>
              <p style="margin: 0; color: #475569; font-style: italic;">"${message}"</p>
            </div>
          `
              : ""
          }

          <h3 style="color: #1e293b; margin: 25px 0 15px 0; font-size: 16px;">File yang dibagikan:</h3>
          ${fileList}

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
            <p style="color: #64748b; font-size: 12px; margin: 0;">
              Email ini dikirim dari CloudShare. File akan tersedia selama pengirim tidak menghapusnya.
            </p>
          </div>
        </div>
      </div>
    `

    // Send emails to all recipients
    const emailPromises = recipientEmails.map((email: string) =>
      resend.emails.send({
        from: process.env.HOSTINGER_EMAIL || "noreply@cloudshare.com",
        to: email,
        subject: `${senderEmail} membagikan ${files.length} file dengan Anda`,
        html: emailHtml,
      }),
    )

    await Promise.all(emailPromises)

    // Store sharing record (in real app, this would be in a database)
    const shareRecord = {
      id: Date.now().toString(),
      senderEmail,
      recipientEmails,
      files: files.map((f: any) => ({ name: f.name, url: f.url })),
      sharedAt: new Date().toISOString(),
      message: message || null,
    }

    // Store in localStorage for demo (in real app, use database)
    const existingShares = JSON.parse(localStorage.getItem(`shares_${senderEmail}`) || "[]")
    existingShares.push(shareRecord)
    localStorage.setItem(`shares_${senderEmail}`, JSON.stringify(existingShares))

    return NextResponse.json({
      success: true,
      message: `Files berhasil dibagikan ke ${recipientEmails.length} penerima`,
      shareId: shareRecord.id,
    })
  } catch (error) {
    console.error("Email sharing error:", error)
    return NextResponse.json({ error: "Gagal mengirim email. Silakan coba lagi." }, { status: 500 })
  }
}
