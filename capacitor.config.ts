import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.vectorfield.lab',
  appName: 'Vector Field Lab',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    path: 'android',
  },
}

export default config
