import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ia.masa.app',
  appName: 'MASA IA',
  webDir: 'public',
  server: {
    url: 'https://kingmlb-1.sole-sidewinder.ts.net',
    cleartext: false,
    allowNavigation: [
      'kingmlb-1.sole-sidewinder.ts.net',
      '*.sole-sidewinder.ts.net',
    ],
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#07070A',
    preferredContentMode: 'mobile',
    scheme: 'MasaIA',
    scrollEnabled: true,
  },
  plugins: {
    SplashScreen: {
      backgroundColor: '#07070A',
      launchAutoHide: true,
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#07070A',
    },
  },
};

export default config;
