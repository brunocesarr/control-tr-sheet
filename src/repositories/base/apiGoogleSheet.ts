import { JWT } from 'google-auth-library'

const googlePrivateKeyFormatted =
  process.env.GOOGLE_PRIVATE_KEY?.split(String.raw`\n`).join('\n') ?? ''

const spreadSheetAccountAuth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: googlePrivateKeyFormatted,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})

export { spreadSheetAccountAuth }
