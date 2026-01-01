import { put, list } from "@vercel/blob";

// Fonction pour envoyer une notification Telegram
async function sendTelegramNotification(data) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.log('Variables Telegram non configurées, notification non envoyée');
    return;
  }

  try {
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const toolLabels = {
      'notion-dashboard': '📊 Dashboard Notion pour Agents',
      'email-generator': '✉️ Générateur de Templates d\'Emails',
      'real-estate-generator': '🏠 Générateur Immobilier'
    };

    const toolLabel = toolLabels[data.tool] || data.tool || 'Outil inconnu';
    
    let telegramMessage = `📥 *Nouveau téléchargement d'outil !*\n\n`;
    telegramMessage += `🌐 *Site :* corentinrobert.fr\n`;
    telegramMessage += `📊 *Informations :*\n`;
    telegramMessage += `• Date : ${dateStr}\n`;
    telegramMessage += `• Outil : ${toolLabel}\n`;
    telegramMessage += `• Email : ${data.email}\n`;

    const tgUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const tgPayload = {
      chat_id: chatId,
      text: telegramMessage,
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    };

    const tgResp = await fetch(tgUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tgPayload)
    });

    const responseBody = await tgResp.text();
    let parsedBody;
    try {
      parsedBody = JSON.parse(responseBody);
    } catch {
      parsedBody = responseBody;
    }

    if (tgResp.ok) {
      console.log('✅ Notification Telegram envoyée avec succès:', parsedBody);
    } else {
      console.error('❌ Telegram API erreur:', {
        status: tgResp.status,
        statusText: tgResp.statusText,
        response: parsedBody,
        url: tgUrl.replace(botToken, '***'),
        chatId
      });
    }
  } catch (error) {
    console.error('❌ Erreur envoi notification Telegram:', {
      message: error.message,
      stack: error.stack
    });
  }
}

export default async function handler(req, res) {
  console.log('API collect-email appelée:', req.method, req.body);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, tool } = req.body;
  console.log('Données reçues:', { email, tool });

  // Validation de l'email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    console.log('Email invalide:', email);
    return res.status(400).json({ error: 'Email invalide' });
  }

  // Liste des domaines de mail de test à bloquer
  const blockedDomains = [
    'yopmail.com',
    'yopmail.fr',
    'yopmail.net',
    'guerrillamail.com',
    'guerrillamailblock.com',
    'sharklasers.com',
    'grr.la',
    'guerrillamail.info',
    'guerrillamail.biz',
    'guerrillamail.org',
    'pokemail.net',
    'spam4.me',
    'bccto.me',
    'chitthi.in',
    '10minutemail.com',
    '10minutemail.de',
    '10minutemail.net',
    '10minutemail.org',
    '20minutemail.com',
    '33mail.com',
    'throwaway.email',
    'tempmail.com',
    'tempmail.net',
    'tempmail.org',
    'temp-mail.org',
    'temp-mail.io',
    'mailinator.com',
    'mohmal.com',
    'fakeinbox.com',
    'trashmail.com',
    'dispostable.com',
    'mintemail.com',
    'getnada.com',
    'maildrop.cc',
    'mytemp.email',
    'tmpmail.org',
    'emailondeck.com',
    'mailcatch.com',
    'meltmail.com',
    'mailnesia.com',
    'mailforspam.com',
    'spamgourmet.com',
    'spambox.us',
    'spamhole.com',
    'spamfree24.org',
    'spamfree24.de',
    'spamfree24.eu',
    'spamfree24.net',
    'spamfree24.com',
    'spamgourmet.com',
    'spamhole.com',
    'spamtraps.com',
    'test.com',
    'test.fr',
    'example.com',
    'example.org',
    'example.net',
    'testmail.com',
    'testmail.net',
    'testmail.org'
  ];

  // Extraire le domaine de l'email
  const emailDomain = email.split('@')[1]?.toLowerCase();
  
  // Vérifier si le domaine est bloqué
  if (emailDomain && blockedDomains.includes(emailDomain)) {
    console.log('Email de test bloqué:', email);
    return res.status(400).json({ 
      error: 'Les emails de test ne sont pas autorisés. Veuillez utiliser une adresse email valide.' 
    });
  }

  try {
    console.log('Début de la sauvegarde...');
    
    // Récupérer la liste existante des emails
    let existingEmails = [];
    try {
      console.log('Récupération des emails existants...');
      const { blobs } = await list({ prefix: 'tools-emails/' });
      console.log('Blobs trouvés:', blobs.length);
      
      if (blobs.length > 0) {
        // Trier les fichiers par date de modification (le plus récent en premier)
        const sortedBlobs = blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
        const latestBlob = sortedBlobs[0];
        console.log('Fichier le plus récent:', latestBlob.pathname, '(', latestBlob.uploadedAt, ')');
        const response = await fetch(latestBlob.url);
        existingEmails = await response.json();
        console.log('Emails existants:', existingEmails.length);
      }
    } catch (error) {
      console.log('Aucun fichier d\'emails existant, création d\'un nouveau:', error.message);
    }

    // Vérifier si l'email existe déjà
    const emailExists = existingEmails.some(entry => entry.email === email);
    console.log('Email existe déjà:', emailExists);
    
    if (!emailExists) {
      // Ajouter le nouvel email
      const newEmailEntry = {
        email,
        tool: tool || 'notion-dashboard',
        timestamp: new Date().toISOString()
      };
      
      existingEmails.push(newEmailEntry);
      console.log('Nouvel email ajouté:', newEmailEntry);
      
      // Sauvegarder dans Vercel Blob
      const filename = `tools-emails/emails-${Date.now()}.json`;
      console.log('Sauvegarde dans:', filename);
      
      const result = await put(filename, JSON.stringify(existingEmails, null, 2), { 
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN
      });
      
      console.log('Sauvegarde réussie:', result.url);
    } else {
      console.log('Email déjà existant, pas de sauvegarde');
    }

    // Envoyer une notification Telegram pour chaque téléchargement
    await sendTelegramNotification({
      email,
      tool: tool || 'notion-dashboard'
    });

    res.status(200).json({ 
      success: true, 
      message: 'Email enregistré avec succès',
      isNew: !emailExists,
      downloadUrl: emailExists ? '/api/tools/download-csv' : null
    });

  } catch (error) {
    console.error('Erreur lors de la sauvegarde de l\'email:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la sauvegarde de l\'email' 
    });
  }
}

