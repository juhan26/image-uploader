// Email configuration
export const emailConfig = {
  // Domain untuk pengiriman email
  domain: "sender.juhndaa.my.id",

  // Nama pengirim yang akan ditampilkan
  senderName: "NBD CHARITY",

  // Template email
  templates: {
    default: {
      subject: "NBD CHARITY - Zakat Al fitri 2025",
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>NBD CHARITY - Zakat Al fitri 2025</h2>
          <p>Merci pour vote confiance, n'hésitez pas à me contacter si vous voulez parrainer les orphelins sur le long terme </p>

          <p>Rejoignez le groupe telegram en cliquant sur ce lien : </p>

          <p> https://t.me/nbdcharity </p>

          <p> Qu'Allah vous récompense </p>
          {{content}}
          <p style="margin-top: 30px; color: #666;">Envoyé via sender.juhndaa.my.id</p>
        </div>
      `,
    },
  },
}
