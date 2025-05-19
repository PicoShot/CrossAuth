import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import Header from "./components/Header";
import CodesList from "./components/CodesList";
import QRScanModal from "./components/modals/QRScanModal";
import ManualEntryModal from "./components/modals/ManualEntryModal";
import ImportModal from "./components/modals/ImportModal";
import SettingsModal from "./components/modals/SettingsModal";
import PasswordPromptModal from "./components/modals/PasswordPromptModal";
import storageService from "./services/storageService";
import { AuthAccount, AppSettings } from "./types";

function App() {
  const [accounts, setAccounts] = useState<AuthAccount[]>([]);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isManualEntryModalOpen, setIsManualEntryModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings>({
    streamerMode: false,
    passwordProtected: false,
    autoLock: 0,
    biometricEnabled: false,
  });

  useEffect(() => {
    const checkLockStatus = () => {
      const settings = storageService.getSettingsWithoutDecryption();
      const passwordProtected =
        settings?.passwordProtected || storageService.isPasswordProtected();

      if (passwordProtected && !storageService.isUnlockedStatus()) {
        setIsLocked(true);
      } else {
        loadAppData();
      }
    };

    checkLockStatus();

    window.addEventListener("focus", () => {
      if (
        storageService.isPasswordProtected() &&
        !storageService.isUnlockedStatus()
      ) {
        setIsLocked(true);
      }
    });

    return () => {
      window.removeEventListener("focus", () => {});
    };
  }, []);

  const loadAppData = () => {
    setIsLoading(true);
    try {
      const loadedAccounts = storageService.getAccounts();
      setAccounts(loadedAccounts);

      const settings: AppSettings = storageService.getSettings();
      setAppSettings(settings);

      setIsLocked(false);
    } catch (error) {
      console.error("Failed to load app data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppUnlock = () => {
    setIsLocked(false);
    loadAppData();
  };

  const handleAddAccount = (account: AuthAccount) => {
    try {
      const updatedAccounts = storageService.saveAccount(account);
      setAccounts(updatedAccounts);
    } catch (error) {
      console.error("Failed to add account:", error);
    }
  };

  const handleAddMultipleAccounts = (newAccounts: AuthAccount[]) => {
    try {
      let currentAccounts = [...accounts];

      for (const account of newAccounts) {
        currentAccounts = storageService.saveAccount(account);
      }

      setAccounts(currentAccounts);
    } catch (error) {
      console.error("Failed to add multiple accounts:", error);
    }
  };

  const handleUpdateAccount = (updatedAccount: AuthAccount) => {
    try {
      const updatedAccounts = storageService.updateAccount(updatedAccount);
      setAccounts(updatedAccounts);
    } catch (error) {
      console.error("Failed to update account:", error);
    }
  };

  const handleDeleteAccount = (id: string) => {
    try {
      const updatedAccounts = storageService.deleteAccount(id);
      setAccounts(updatedAccounts);
    } catch (error) {
      console.error("Failed to delete account:", error);
    }
  };

  const handleImportAccounts = (importedAccounts: AuthAccount[]) => {
    try {
      const updatedAccounts = storageService.importAccounts(importedAccounts);
      setAccounts(updatedAccounts);
    } catch (error) {
      console.error("Failed to import accounts:", error);
    }
  };

  const handleExportAccounts = () => {
    try {
      const accounts = storageService.exportAccounts();

      if (accounts.length > 0) {
        const dataStr =
          "data:text/json;charset=utf-8," +
          encodeURIComponent(JSON.stringify(accounts));
        const downloadAnchorNode = document.createElement("a");
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute(
          "download",
          "authenticator_backup_" +
            new Date().toISOString().slice(0, 10) +
            ".json",
        );
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
      }
    } catch (error) {
      console.error("Failed to export accounts:", error);
    }
  };

  const handleSettingsChange = (newSettings: any) => {
    setAppSettings(newSettings);
  };

  const handleMenuAction = (action: string) => {
    switch (action) {
      case "scan-qr":
        setIsQRModalOpen(true);
        break;
      case "manual-entry":
        setIsManualEntryModalOpen(true);
        break;
      case "import":
        setIsImportModalOpen(true);
        break;
      case "export":
        handleExportAccounts();
        break;
      case "settings":
        setIsSettingsModalOpen(true);
        break;
      default:
        break;
    }
  };

  if (isLocked) {
    return (
      <div className="h-screen w-full bg-dark-bg text-white overflow-hidden flex flex-col">
        <Header title="Authenticator - Locked" />
        <PasswordPromptModal
          isOpen={true}
          onClose={() => {}}
          onUnlock={handleAppUnlock}
        />
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-dark-bg text-white overflow-hidden flex flex-col">
      <Header />

      <main className="flex-1 overflow-y-auto py-2 px-4">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-16 w-16 bg-dark-border rounded-full mb-4"></div>
              <div className="h-4 w-32 bg-dark-border rounded"></div>
            </div>
          </div>
        ) : (
          <CodesList
            accounts={accounts}
            onDelete={handleDeleteAccount}
            onUpdate={handleUpdateAccount}
            onMenuAction={handleMenuAction}
            streamerMode={appSettings.streamerMode}
          />
        )}
      </main>

      <AnimatePresence>
        {isQRModalOpen && (
          <QRScanModal
            isOpen={isQRModalOpen}
            onClose={() => setIsQRModalOpen(false)}
            onAccountAdded={handleAddAccount}
            onMultipleAccountsAdded={handleAddMultipleAccounts}
          />
        )}

        {isManualEntryModalOpen && (
          <ManualEntryModal
            isOpen={isManualEntryModalOpen}
            onClose={() => setIsManualEntryModalOpen(false)}
            onAccountAdded={handleAddAccount}
          />
        )}

        {isImportModalOpen && (
          <ImportModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            onImport={handleImportAccounts}
          />
        )}

        {isSettingsModalOpen && (
          <SettingsModal
            isOpen={isSettingsModalOpen}
            onClose={() => setIsSettingsModalOpen(false)}
            onSettingsChange={handleSettingsChange}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
