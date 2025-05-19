import CryptoJS from "crypto-js";
import { AuthAccount } from "../types";

interface AppSettings {
  streamerMode?: boolean;
  passwordProtected?: boolean;
  autoLock?: number;
  biometricEnabled?: boolean;
  theme?: "dark" | "light";
}

const STORAGE_KEYS = {
  ACCOUNTS: "authenticator_accounts",
  SETTINGS: "authenticator_settings",
  PASSWORD_HASH: "authenticator_password",
  PASSWORD_CHECK: "authenticator_password_check",
  PASSWORD_HINT: "authenticator_password_hint",
  BIOMETRIC_KEY: "authenticator_biometric_key",
};

class StorageService {
  private customPassword: string | null = null;
  private isUnlocked: boolean = false;
  private readonly defaultEncryptionKey: string;
  private lastActivityTime: number = Date.now();

  constructor() {
    this.defaultEncryptionKey = this.generateDefaultEncryptionKey();
    this.checkAutoLock();
  }

  private generateDefaultEncryptionKey(): string {
    const userAgent = navigator.userAgent;
    const language = navigator.language;
    const screenWidth = window.screen.width.toString();
    const screenHeight = window.screen.height.toString();
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const keyData = `${userAgent}-${language}-${screenWidth}x${screenHeight}-${timeZone}`;

    return CryptoJS.SHA256(keyData).toString();
  }

  private checkAutoLock() {
    const settings = this.getSettingsWithoutDecryption();
    const autoLockMinutes = settings?.autoLock || 0;

    if (autoLockMinutes > 0 && this.isPasswordProtected()) {
      const checkInterval = setInterval(() => {
        const now = Date.now();
        const inactivityTime = (now - this.lastActivityTime) / (1000 * 60);

        if (inactivityTime >= autoLockMinutes && this.isUnlocked) {
          this.lock();
          console.log("Auto-locked due to inactivity");
        }
      }, 30000);

      window.addEventListener("beforeunload", () => {
        clearInterval(checkInterval);
      });

      ["mousedown", "keydown", "touchstart", "scroll"].forEach((eventType) => {
        document.addEventListener(eventType, () => {
          this.updateActivityTime();
        });
      });
    }
  }

  public updateActivityTime() {
    this.lastActivityTime = Date.now();
  }

  private getEncryptionKey(): string {
    if (this.customPassword) {
      return CryptoJS.SHA256(this.customPassword).toString();
    }
    return this.defaultEncryptionKey;
  }

  private encrypt(data: any): string {
    this.updateActivityTime();
    return CryptoJS.AES.encrypt(
      JSON.stringify(data),
      this.getEncryptionKey(),
    ).toString();
  }

  private decrypt(encryptedData: string): any {
    this.updateActivityTime();
    try {
      const key = this.getEncryptionKey();
      const bytes = CryptoJS.AES.decrypt(encryptedData, key);
      const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);

      if (!decryptedStr) {
        console.error("Decryption resulted in empty string");
        return null;
      }

      try {
        return JSON.parse(decryptedStr);
      } catch (jsonError) {
        console.error("Failed to parse decrypted JSON:", jsonError);
        return null;
      }
    } catch (error) {
      console.error("Failed to decrypt data:", error);
      return null;
    }
  }

  private decryptWithKey(encryptedData: string, key: string): any {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, key);
      const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);

      if (!decryptedStr) {
        console.error("Decryption resulted in empty string");
        return null;
      }

      try {
        return JSON.parse(decryptedStr);
      } catch (jsonError) {
        console.error("Failed to parse decrypted JSON:", jsonError);
        return null;
      }
    } catch (error) {
      console.error("Failed to decrypt data with specific key:", error);
      return null;
    }
  }

  private encryptWithKey(data: any, key: string): string {
    try {
      return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
    } catch (error) {
      console.error("Failed to encrypt data with specific key:", error);
      throw error;
    }
  }

  public isPasswordProtected(): boolean {
    return localStorage.getItem(STORAGE_KEYS.PASSWORD_HASH) !== null;
  }

  public isUnlockedStatus(): boolean {
    return this.isUnlocked;
  }

  public lock(): void {
    this.customPassword = null;
    this.isUnlocked = false;
  }

  public setCustomPassword(password: string, hint?: string): void {
    const newPasswordKey = CryptoJS.SHA256(password).toString();
    const oldKey = this.getEncryptionKey();

    localStorage.setItem(STORAGE_KEYS.PASSWORD_HASH, newPasswordKey);

    const verificationString = "VALID_PASSWORD_CHECK";
    const encryptedVerification = CryptoJS.AES.encrypt(
      verificationString,
      newPasswordKey,
    ).toString();
    localStorage.setItem(STORAGE_KEYS.PASSWORD_CHECK, encryptedVerification);

    if (hint) {
      localStorage.setItem(STORAGE_KEYS.PASSWORD_HINT, hint);
    } else {
      localStorage.removeItem(STORAGE_KEYS.PASSWORD_HINT);
    }

    let accounts: AuthAccount[] = [];
    const encryptedAccounts = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    if (encryptedAccounts) {
      try {
        accounts = this.decryptWithKey(encryptedAccounts, oldKey) || [];
      } catch (err) {
        console.error("Could not decrypt accounts with old key", err);
      }
    }

    let settings: AppSettings = {
      streamerMode: false,
      passwordProtected: true,
      autoLock: 0,
      biometricEnabled: false,
      theme: "dark",
    };

    const encryptedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (encryptedSettings) {
      try {
        const decryptedSettings = this.decryptWithKey(
          encryptedSettings,
          oldKey,
        );
        if (decryptedSettings) {
          settings = decryptedSettings;
        }
      } catch (err) {
        console.error("Could not decrypt settings with old key", err);
      }
    }

    this.customPassword = password;
    this.isUnlocked = true;

    if (accounts && accounts.length > 0) {
      try {
        const newEncryptedAccounts = this.encryptWithKey(
          accounts,
          newPasswordKey,
        );
        localStorage.setItem(STORAGE_KEYS.ACCOUNTS, newEncryptedAccounts);
      } catch (err) {
        console.error("Failed to encrypt accounts with new key", err);
      }
    }

    settings.passwordProtected = true;
    try {
      const newEncryptedSettings = this.encryptWithKey(
        settings,
        newPasswordKey,
      );
      localStorage.setItem(STORAGE_KEYS.SETTINGS, newEncryptedSettings);
    } catch (err) {
      console.error("Failed to encrypt settings with new key", err);
    }
  }

  public removeCustomPassword(): void {
    if (!this.isPasswordProtected()) {
      return;
    }

    const accounts = this.getAccounts();

    localStorage.removeItem(STORAGE_KEYS.PASSWORD_HASH);
    localStorage.removeItem(STORAGE_KEYS.PASSWORD_CHECK);
    localStorage.removeItem(STORAGE_KEYS.PASSWORD_HINT);
    localStorage.removeItem(STORAGE_KEYS.BIOMETRIC_KEY);

    this.customPassword = null;
    this.isUnlocked = true;

    if (accounts.length > 0) {
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, this.encrypt(accounts));
    }

    const settings = this.getSettings();
    settings.passwordProtected = false;
    settings.biometricEnabled = false;
    localStorage.setItem(STORAGE_KEYS.SETTINGS, this.encrypt(settings));
  }

  public verifyPassword(password: string): boolean {
    if (!this.isPasswordProtected()) {
      return false;
    }

    try {
      const storedCheckValue = localStorage.getItem(
        STORAGE_KEYS.PASSWORD_CHECK,
      );
      if (!storedCheckValue) return false;

      const passwordKey = CryptoJS.SHA256(password).toString();
      const decryptedCheck = CryptoJS.AES.decrypt(
        storedCheckValue,
        passwordKey,
      );
      const checkString = decryptedCheck.toString(CryptoJS.enc.Utf8);

      return checkString === "VALID_PASSWORD_CHECK";
    } catch (error) {
      return false;
    }
  }

  public unlockWithPassword(password: string): boolean {
    if (this.verifyPassword(password)) {
      this.customPassword = password;
      this.isUnlocked = true;
      this.updateActivityTime();

      const settings = this.getSettings();
      if (settings.biometricEnabled) {
        this.storeBiometricKey(password);
      }

      return true;
    }
    return false;
  }

  private storeBiometricKey(password: string): void {
    const biometricKeyPrefix = "BIOMETRIC_KEY:";
    const encryptedKey = CryptoJS.AES.encrypt(
      biometricKeyPrefix + password,
      this.defaultEncryptionKey,
    ).toString();

    localStorage.setItem(STORAGE_KEYS.BIOMETRIC_KEY, encryptedKey);
  }

  public getBiometricStoredPassword(): string | null {
    try {
      const encryptedKey = localStorage.getItem(STORAGE_KEYS.BIOMETRIC_KEY);
      if (!encryptedKey) return null;

      const decryptedValue = CryptoJS.AES.decrypt(
        encryptedKey,
        this.defaultEncryptionKey,
      ).toString(CryptoJS.enc.Utf8);

      if (decryptedValue.startsWith("BIOMETRIC_KEY:")) {
        return decryptedValue.substring("BIOMETRIC_KEY:".length);
      }

      return null;
    } catch (error) {
      console.error("Failed to retrieve biometric key:", error);
      return null;
    }
  }

  public getPasswordHint(): string | null {
    return localStorage.getItem(STORAGE_KEYS.PASSWORD_HINT);
  }

  public getAccounts(): AuthAccount[] {
    try {
      const encryptedData = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);

      if (!encryptedData) {
        return [];
      }

      const decryptedData = this.decrypt(encryptedData);
      return Array.isArray(decryptedData) ? decryptedData : [];
    } catch (error) {
      console.error("Error retrieving accounts:", error);
      return [];
    }
  }

  public saveAccount(account: AuthAccount): AuthAccount[] {
    try {
      const accounts = this.getAccounts();
      const updatedAccounts = [...accounts, account];
      localStorage.setItem(
        STORAGE_KEYS.ACCOUNTS,
        this.encrypt(updatedAccounts),
      );
      return updatedAccounts;
    } catch (error) {
      console.error("Error saving account:", error);
      return this.getAccounts();
    }
  }

  public updateAccount(updatedAccount: AuthAccount): AuthAccount[] {
    try {
      const accounts = this.getAccounts();
      const updatedAccounts = accounts.map((account) =>
        account.id === updatedAccount.id ? updatedAccount : account,
      );
      localStorage.setItem(
        STORAGE_KEYS.ACCOUNTS,
        this.encrypt(updatedAccounts),
      );
      return updatedAccounts;
    } catch (error) {
      console.error("Error updating account:", error);
      return this.getAccounts();
    }
  }

  public deleteAccount(id: string): AuthAccount[] {
    try {
      const accounts = this.getAccounts();
      const updatedAccounts = accounts.filter((account) => account.id !== id);
      localStorage.setItem(
        STORAGE_KEYS.ACCOUNTS,
        this.encrypt(updatedAccounts),
      );
      return updatedAccounts;
    } catch (error) {
      console.error("Error deleting account:", error);
      return this.getAccounts();
    }
  }

  public importAccounts(importedAccounts: AuthAccount[]): AuthAccount[] {
    try {
      const accounts = this.getAccounts();

      const existingSecrets = new Set(accounts.map((acc) => acc.secret));

      const newAccounts = importedAccounts.filter(
        (acc) => !existingSecrets.has(acc.secret),
      );

      const updatedAccounts = [...accounts, ...newAccounts];
      localStorage.setItem(
        STORAGE_KEYS.ACCOUNTS,
        this.encrypt(updatedAccounts),
      );

      return updatedAccounts;
    } catch (error) {
      console.error("Error importing accounts:", error);
      return this.getAccounts();
    }
  }

  public exportAccounts(): AuthAccount[] {
    return this.getAccounts();
  }

  public getSettingsWithoutDecryption(): AppSettings | null {
    try {
      const encryptedData = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!encryptedData) {
        return {
          streamerMode: false,
          passwordProtected: this.isPasswordProtected(),
          autoLock: 0,
          biometricEnabled: false,
          theme: "dark",
        };
      }

      try {
        const bytes = CryptoJS.AES.decrypt(
          encryptedData,
          this.defaultEncryptionKey,
        );
        const settings = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

        settings.passwordProtected = this.isPasswordProtected();

        return settings;
      } catch {
        return {
          streamerMode: false,
          passwordProtected: true,
          autoLock: 0,
          biometricEnabled:
            localStorage.getItem(STORAGE_KEYS.BIOMETRIC_KEY) !== null,
          theme: "dark",
        };
      }
    } catch (error) {
      console.error("Error retrieving settings:", error);
      return null;
    }
  }

  public getSettings(): AppSettings {
    try {
      const encryptedData = localStorage.getItem(STORAGE_KEYS.SETTINGS);

      if (!encryptedData) {
        return {
          streamerMode: false,
          passwordProtected: this.isPasswordProtected(),
          autoLock: 0,
          biometricEnabled: false,
          theme: "dark",
        };
      }

      const decryptedData = this.decrypt(encryptedData);

      decryptedData.passwordProtected = this.isPasswordProtected();

      return decryptedData;
    } catch (error) {
      console.error("Error retrieving settings:", error);
      return {
        streamerMode: false,
        passwordProtected: this.isPasswordProtected(),
        autoLock: 0,
        biometricEnabled: false,
        theme: "dark",
      };
    }
  }

  public saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, this.encrypt(settings));
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  }

  public clearAccounts(): void {
    localStorage.removeItem(STORAGE_KEYS.ACCOUNTS);
  }

  public clearSettings(): void {
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.PASSWORD_HASH);
    localStorage.removeItem(STORAGE_KEYS.PASSWORD_CHECK);
    localStorage.removeItem(STORAGE_KEYS.PASSWORD_HINT);
    localStorage.removeItem(STORAGE_KEYS.BIOMETRIC_KEY);
    this.customPassword = null;
    this.isUnlocked = false;
  }
}

const storageService = new StorageService();
export default storageService;
