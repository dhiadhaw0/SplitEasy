export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
  /**
   * Used instead of apiUrl when running inside the native Capacitor shell (Android/iOS), where
   * "localhost" means the device itself, not your dev machine.
   * Set to the dev machine's Wi-Fi LAN IP so a physical phone on the same network can reach it.
   * (The Android emulator would instead need the special alias 10.0.2.2 — swap back to that,
   * e.g. 'http://10.0.2.2:8080/api', if you go back to testing on the emulator.)
   */
  nativeApiUrl: 'http://192.168.100.21:8080/api'
};
