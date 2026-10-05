import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Currency } from '../models/enums';

const REMINDER_DELAY_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

/**
 * Schedules a one-off local reminder ("you still owe X in <group>") a few days out whenever an
 * outstanding balance is seen, and cancels it once the balance is settled. Purely device-local:
 * no server round-trip when it fires, so it works even if the app hasn't been reopened since.
 */
@Injectable({ providedIn: 'root' })
export class ReminderService {
  private permissionDenied = false;

  async scheduleBalanceReminder(groupId: number, groupName: string, myBalance: number, currency: Currency): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const id = notificationIdFor(groupId);
    await LocalNotifications.cancel({ notifications: [{ id }] });

    if (Math.abs(myBalance) < 0.005) {
      return; // settled — nothing worth reminding about
    }

    const granted = await this.ensurePermission();
    if (!granted) {
      return;
    }

    const amount = `${Math.abs(myBalance).toFixed(2)} ${currency}`;
    const body = myBalance < 0
      ? `Vous devez encore ${amount} dans "${groupName}".`
      : `On vous doit ${amount} dans "${groupName}".`;

    await LocalNotifications.schedule({
      notifications: [{
        id,
        title: 'SplitEasy',
        body,
        schedule: { at: new Date(Date.now() + REMINDER_DELAY_MS) }
      }]
    });
  }

  async cancelGroupReminder(groupId: number): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    await LocalNotifications.cancel({ notifications: [{ id: notificationIdFor(groupId) }] });
  }

  private async ensurePermission(): Promise<boolean> {
    if (this.permissionDenied) {
      return false;
    }
    const status = await LocalNotifications.checkPermissions();
    if (status.display === 'granted') {
      return true;
    }
    const result = await LocalNotifications.requestPermissions();
    this.permissionDenied = result.display !== 'granted';
    return !this.permissionDenied;
  }
}

/** Simple stable namespace so future notification types don't collide with these ids. */
function notificationIdFor(groupId: number): number {
  return 1000 + groupId;
}
