export interface AuthAccount {
  id: string;
  name: string;
  issuer?: string;
  secret: string;
  algorithm?: "SHA1" | "SHA256" | "SHA512";
  digits?: number;
  period?: number;
  color?: string;
  icon?: string;
  createdAt: number;
  lastUsed?: number;
}

export interface AppSettings {
  streamerMode?: boolean;
  passwordProtected?: boolean;
  autoLock?: number;
  biometricEnabled?: boolean;
}

export interface TOTPCode {
  code: string;
  timeRemaining: number;
  period: number;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface MenuOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
}

export type ThemeMode = "dark" | "light";

export interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
}

declare global {
  interface Window {
    electronAPI?: {
      getAccounts: () => Promise<AuthAccount[]>;
      saveAccount: (account: AuthAccount) => Promise<AuthAccount[]>;
      updateAccount: (account: AuthAccount) => Promise<AuthAccount[]>;
      deleteAccount: (id: string) => Promise<AuthAccount[]>;
      importAccounts: (accounts: AuthAccount[]) => Promise<AuthAccount[]>;
      notifyCodeCopied: () => void;
      getPlatform: () => string;
      getVersion: () => string;
    };
  }
}
