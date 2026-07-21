import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'app.pinned.ios',
  appName: 'Pinned',
  webDir: 'public',
  server: {
    url: process.env.CAPACITOR_SERVER_URL ?? 'https://pinned-eight-flax.vercel.app',
    cleartext: false,
  },
  ios: {
    contentInset: 'automatic',
  },
  plugins: {},
}

export default config
