// Endpoint de test pour vérifier la configuration Telegram

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  // Vérifier les variables d'environnement
  if (!botToken || !chatId) {
    return res.status(500).json({ 
      error: 'Variables Telegram non configurées',
      details: {
        hasBotToken: !!botToken,
        hasChatId: !!chatId,
        botTokenLength: botToken ? botToken.length : 0,
        chatIdValue: chatId || 'non défini'
      }
    });
  }

  try {
    const testMessage = `🧪 *Test de notification Telegram*\n\n`;
    const testMessageFull = testMessage + `• Date : ${new Date().toLocaleString('fr-FR')}\n• Test : OK\n`;

    const tgUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const tgPayload = {
      chat_id: chatId,
      text: testMessageFull,
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    };

    console.log('Envoi test Telegram:', {
      url: tgUrl.replace(botToken, '***'),
      chatId,
      messageLength: testMessageFull.length
    });

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
      return res.status(200).json({ 
        success: true,
        message: 'Notification Telegram envoyée avec succès',
        telegramResponse: parsedBody
      });
    } else {
      return res.status(500).json({ 
        error: 'Erreur lors de l\'envoi Telegram',
        status: tgResp.status,
        telegramResponse: parsedBody,
        details: {
          url: tgUrl.replace(botToken, '***'),
          chatId,
          payload: { ...tgPayload, text: testMessageFull.substring(0, 50) + '...' }
        }
      });
    }
  } catch (error) {
    console.error('Erreur test Telegram:', error);
    return res.status(500).json({ 
      error: 'Erreur lors du test Telegram',
      details: error.message,
      stack: error.stack
    });
  }
}

