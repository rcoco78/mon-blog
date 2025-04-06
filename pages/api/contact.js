export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { name, email, subject, message, type } = req.body

    // Ici, vous pouvez ajouter la logique pour envoyer l'email
    // Par exemple, en utilisant un service comme SendGrid, AWS SES, etc.
    // Pour l'instant, nous allons simplement simuler un envoi réussi

    // Exemple avec SendGrid (à décommenter et configurer si vous souhaitez l'utiliser)
    /*
    const sgMail = require('@sendgrid/mail')
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)

    const msg = {
      to: 'contact@corentinrobert.com',
      from: 'contact@corentinrobert.com',
      subject: `Nouveau message de contact: ${subject}`,
      text: `
        Nom: ${name}
        Email: ${email}
        Type: ${type}
        Sujet: ${subject}
        Message: ${message}
      `,
      html: `
        <p><strong>Nom:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Type:</strong> ${type}</p>
        <p><strong>Sujet:</strong> ${subject}</p>
        <p><strong>Message:</strong> ${message}</p>
      `,
    }

    await sgMail.send(msg)
    */

    // Simuler un délai pour l'exemple
    await new Promise(resolve => setTimeout(resolve, 1000))

    return res.status(200).json({ message: 'Message envoyé avec succès' })
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error)
    return res.status(500).json({ message: 'Erreur lors de l\'envoi du message' })
  }
} 