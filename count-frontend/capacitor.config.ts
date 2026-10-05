import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.spliteasy.app',
  appName: 'SplitEasy',
  webDir: 'dist/spliteasy-web/browser',
  // Capacitor defaults to serving the app over https://localhost, which makes the WebView block
  // any plain http:// API call as "mixed content" — irrelevant to CORS or network reachability,
  // it's blocked before the request is even sent. Our backend is plain HTTP in dev, so the app
  // itself is served over http:// too, matching schemes. Revisit this once the backend has TLS.
  server: {
    androidScheme: 'http'
  }
};

export default config;
