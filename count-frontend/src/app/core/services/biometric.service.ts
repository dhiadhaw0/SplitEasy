import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { AccessControl, NativeBiometric } from '@capgo/capacitor-native-biometric';

const SERVER = 'com.spliteasy.app';

export interface StoredCredentials {
  username: string;
  password: string;
}

/**
 * Thin wrapper around @capgo/capacitor-native-biometric — password is stored behind the
 * device's Keystore/Keychain (accessControl: BIOMETRY_ANY), never in plain preferences or
 * localStorage. Every method is a no-op returning a safe default on the web, since biometrics
 * only make sense inside the native app shell.
 */
@Injectable({ providedIn: 'root' })
export class BiometricService {
  async isAvailable(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }
    try {
      const result = await NativeBiometric.isAvailable();
      return result.isAvailable;
    } catch {
      return false;
    }
  }

  async hasStoredCredentials(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }
    try {
      const result = await NativeBiometric.isCredentialsSaved({ server: SERVER });
      return result.isSaved;
    } catch {
      return false;
    }
  }

  async saveCredentials(email: string, password: string): Promise<void> {
    await NativeBiometric.setCredentials({
      username: email,
      password,
      server: SERVER,
      accessControl: AccessControl.BIOMETRY_ANY,
      title: 'Protéger vos identifiants'
    });
  }

  async getCredentials(): Promise<StoredCredentials | null> {
    try {
      return await NativeBiometric.getSecureCredentials({
        server: SERVER,
        reason: 'Déverrouillez SplitEasy',
        title: 'Authentification biométrique'
      });
    } catch {
      return null;
    }
  }

  async clearCredentials(): Promise<void> {
    try {
      await NativeBiometric.deleteCredentials({ server: SERVER });
    } catch {
      // Nothing stored — fine.
    }
  }
}
