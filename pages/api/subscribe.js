import { google } from 'googleapis'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { email, date } = req.body

  if (!email) {
    return res.status(400).json({ message: 'Email is required' })
  }

  try {
    // Configuration de l'authentification Google Sheets
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') : '',
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })

    const sheets = google.sheets({ version: 'v4', auth })
    
    // Récupérer les données de la feuille de calcul pour vérifier si l'email existe déjà
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'data!A:A', // Colonne A contenant les emails
    })

    const rows = response.data.values || []
    
    // Vérifier si l'email existe déjà
    const emailExists = rows.some(row => row[0] && row[0].toLowerCase() === email.toLowerCase())
    
    if (emailExists) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Cette adresse e-mail est déjà inscrite.' 
      })
    }
    
    // Si l'email n'existe pas, l'ajouter à la feuille
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'data!A:B',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[email, date]],
      },
    })
    
    return res.status(200).json({ 
      status: 'success',
      message: 'Inscription enregistrée avec succès' 
    })
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error)
    return res.status(500).json({ 
      status: 'error',
      message: 'Erreur lors de l\'inscription' 
    })
  }
} 