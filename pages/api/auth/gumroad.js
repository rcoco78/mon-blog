/**
 * Callback OAuth Gumroad
 * Redirect URI configurée dans l'app Gumroad : https://www.corentinrobert.fr/api/auth/gumroad
 * Cette route doit exister pour que l'app OAuth soit valide.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { code, error } = req.query

  if (error) {
    return res.status(400).json({ error: 'Gumroad authorization failed', details: error })
  }

  if (!code) {
    return res.status(200).json({
      message: 'Gumroad OAuth callback ready',
      hint: 'No authorization code in request - this URL is used as redirect_uri when connecting Gumroad',
    })
  }

  // Code reçu : échange possible ici si besoin (pour connecter d'autres utilisateurs)
  return res.status(200).json({
    message: 'Authorization code received',
    hint: 'Exchange this code for an access token if building a Gumroad connect flow',
  })
}
