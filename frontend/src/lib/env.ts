const apiUrl = import.meta.env.VITE_API_URL

if (!apiUrl) {
  throw new Error('VITE_API_URL is required')
}

const authUrl = import.meta.env.VITE_AUTH_URL ?? new URL(apiUrl).origin

export const env = {
  apiUrl,
  authUrl,
}
