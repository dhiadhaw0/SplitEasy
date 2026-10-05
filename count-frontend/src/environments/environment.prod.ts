export const environment = {
  production: true,
  // TODO: point both of these at the real deployed backend once it exists — a production build
  // packaged into the mobile app can't reach "localhost" on either the phone or a server.
  apiUrl: 'http://localhost:8080/api',
  nativeApiUrl: 'http://localhost:8080/api'
};
