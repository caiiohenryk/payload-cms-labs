import { OAuth2Plugin } from 'payload-oauth2'

export const googleLoginEnabled = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
)

const serverURL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
// Quando definido (ex.: "ioasys.com.br"), contas desse domínio são criadas no primeiro login.
// Sem ele, apenas usuários já cadastrados em `users` conseguem entrar com Google.
const allowedDomain = process.env.GOOGLE_ALLOWED_DOMAIN?.toLowerCase()

export const googleOAuthPlugin = OAuth2Plugin({
  enabled: googleLoginEnabled,
  strategyName: 'google',
  useEmailAsIdentity: true,
  serverURL,
  authCollection: 'users',
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  providerAuthorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  scopes: ['openid', 'email', 'profile'],
  prompt: 'select_account',
  authorizePath: '/oauth/google',
  callbackPath: '/oauth/callback',
  onUserNotFoundBehavior: allowedDomain ? 'create' : 'error',
  getUserInfo: async (accessToken) => {
    const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!response.ok) throw new Error(`Google userinfo falhou: ${response.status}`)

    const user = await response.json()
    const email = String(user.email || '').toLowerCase()

    if (!user.email_verified) throw new Error('E-mail Google não verificado')
    if (allowedDomain && email.split('@')[1] !== allowedDomain) {
      throw new Error(`Domínio não permitido: ${email}`)
    }

    return { email, sub: user.sub }
  },
  successRedirect: () => '/admin',
  failureRedirect: (req, error) => {
    req.payload.logger.error({ err: error, msg: 'Falha no login com Google' })
    return '/admin/login?error=google'
  },
})
