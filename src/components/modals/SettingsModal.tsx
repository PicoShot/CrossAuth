import React, { useState, useEffect } from "react";
import { enable, isEnabled, disable } from "@tauri-apps/plugin-autostart";
import { motion, AnimatePresence } from "framer-motion";
import {
  BiX,
  BiLock,
  BiShow,
  BiHide,
  BiTrash,
  BiInfoCircle,
  BiPlay,
} from "react-icons/bi";
import { ModalProps } from "../../types";
import PasswordModal from "./PasswordModal";
import storageService from "../../services/storageService";

interface SettingsModalProps extends ModalProps {
  onSettingsChange: (settings: any) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  onSettingsChange,
}) => {
  const [streamerMode, setStreamerMode] = useState(false);
  const [passwordProtected, setPasswordProtected] = useState(false);
  const [autoLock, setAutoLock] = useState(0);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showClearDataConfirm, setShowClearDataConfirm] = useState(false);
  const [isAutoStartEnabled, setIsAutoStartEnabled] = useState(false);

  useEffect(() => {
    const settings = storageService.getSettings();
    setStreamerMode(settings.streamerMode || false);
    setPasswordProtected(settings.passwordProtected || false);
    setAutoLock(settings.autoLock || 0);
    setBiometricEnabled(settings.biometricEnabled || false);
    isEnabled().then((enabled) => {
      setIsAutoStartEnabled(enabled);
    });
  }, []);

  const handleAutoStartToggle = async () => {
    const currentlyEnabled = await isEnabled();
    if (currentlyEnabled) {
      await disable();
      setIsAutoStartEnabled(false);
    } else {
      await enable();
      setIsAutoStartEnabled(true);
    }
  };

  const handleStreamerModeToggle = () => {
    const newValue = !streamerMode;
    setStreamerMode(newValue);
    saveSettings({ streamerMode: newValue });
  };

  const handleBiometricToggle = () => {
    const newValue = !biometricEnabled;
    setBiometricEnabled(newValue);
    saveSettings({ biometricEnabled: newValue });
  };

  const handleAutoLockChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(e.target.value);
    setAutoLock(value);
    saveSettings({ autoLock: value });
  };

  const handleOpenPasswordModal = () => {
    setShowPasswordModal(true);
  };

  const handlePasswordSet = (isEnabled: boolean) => {
    setPasswordProtected(isEnabled);
    saveSettings({ passwordProtected: isEnabled });
    setShowPasswordModal(false);
  };

  const handleClearData = () => {
    storageService.clearAccounts();
    storageService.clearSettings();
    setShowClearDataConfirm(false);
    window.location.reload();
  };

  const saveSettings = (partialSettings: any) => {
    const currentSettings = storageService.getSettings();
    const newSettings = { ...currentSettings, ...partialSettings };
    storageService.saveSettings(newSettings);
    onSettingsChange(newSettings);
  };

  return (
    <>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-dark-surface rounded-xl overflow-hidden w-full max-w-md"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center p-4 border-b border-dark-border">
            <h2 className="text-lg font-semibold">Settings</h2>
            <button
              onClick={onClose}
              className="rounded-full p-1 hover:bg-white hover:bg-opacity-10 transition-colors"
            >
              <BiX className="text-2xl" />
            </button>
          </div>

          <div className="p-4 overflow-y-auto max-h-[70vh]">
            <div className="space-y-6">
              <div>
                <h3 className="text-md font-semibold mb-3 text-accent">
                  Security
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <BiLock className="text-xl text-accent" />
                        <span className="font-medium">Password Protection</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Set a master password to encrypt your accounts
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-success font-medium">
                        {passwordProtected ? "Enabled" : "Disabled"}
                      </span>
                      <button
                        onClick={handleOpenPasswordModal}
                        className="px-3 py-1 bg-accent text-white text-sm rounded-md hover:bg-accent-hover transition-colors"
                      >
                        {passwordProtected ? "Change" : "Set"}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">Auto Lock</span>
                      <p className="text-xs text-gray-400 mt-1">
                        Lock app after period of inactivity
                      </p>
                    </div>
                    <select
                      value={autoLock}
                      onChange={handleAutoLockChange}
                      disabled={!passwordProtected}
                      className={`bg-dark-bg border border-dark-border rounded-md px-2 py-1 ${
                        !passwordProtected
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      <option value="0">Never</option>
                      <option value="1">1 minute</option>
                      <option value="5">5 minutes</option>
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="60">1 hour</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">
                        Biometric Authentication (soon)
                      </span>
                      <p className="text-xs text-gray-400 mt-1">
                        Use fingerprint or face recognition to unlock
                      </p>
                    </div>
                    <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full">
                      <input
                        type="checkbox"
                        id="toggle-biometric"
                        className="absolute w-0 h-0 opacity-0"
                        checked={biometricEnabled}
                        onChange={handleBiometricToggle}
                        disabled={!passwordProtected || true}
                      />
                      <label
                        htmlFor="toggle-biometric"
                        className={`block overflow-hidden h-6 rounded-full cursor-pointer ${
                          !passwordProtected || true
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        <span
                          className={`block h-6 w-12 rounded-full transition-colors duration-200 ease-in ${
                            biometricEnabled ? "bg-accent" : "bg-gray-600"
                          }`}
                        >
                          <span
                            className={`block h-5 w-5 mt-0.5 ml-0.5 rounded-full bg-white shadow transform transition-transform duration-200 ease-in ${
                              biometricEnabled
                                ? "translate-x-6"
                                : "translate-x-0"
                            }`}
                          />
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-md font-semibold mb-3 text-accent">
                  Display
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        {streamerMode ? (
                          <BiHide className="text-xl text-accent" />
                        ) : (
                          <BiShow className="text-xl text-accent" />
                        )}
                        <span className="font-medium">Streamer Mode</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Hide codes to prevent them from being visible on streams
                      </p>
                    </div>

                    <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full">
                      <input
                        type="checkbox"
                        id="toggle-streamer"
                        className="absolute w-0 h-0 opacity-0"
                        checked={streamerMode}
                        onChange={handleStreamerModeToggle}
                      />
                      <label
                        htmlFor="toggle-streamer"
                        className="block overflow-hidden h-6 rounded-full cursor-pointer"
                      >
                        <span
                          className={`block h-6 w-12 rounded-full transition-colors duration-200 ease-in ${
                            streamerMode ? "bg-accent" : "bg-gray-600"
                          }`}
                        >
                          <span
                            className={`block h-5 w-5 mt-0.5 ml-0.5 rounded-full bg-white shadow transform transition-transform duration-200 ease-in ${
                              streamerMode ? "translate-x-6" : "translate-x-0"
                            }`}
                          />
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-md font-semibold mb-3 text-accent">
                  System
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <BiPlay className="text-xl text-accent" />
                        <span className="font-medium">Start with System</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Launch CrossAuth automatically when you log in
                      </p>
                    </div>

                    <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full">
                      <input
                        type="checkbox"
                        id="toggle-autostart"
                        className="absolute w-0 h-0 opacity-0"
                        checked={isAutoStartEnabled}
                        onChange={handleAutoStartToggle}
                      />
                      <label
                        htmlFor="toggle-autostart"
                        className="block overflow-hidden h-6 rounded-full cursor-pointer"
                      >
                        <span
                          className={`block h-6 w-12 rounded-full transition-colors duration-200 ease-in ${
                            isAutoStartEnabled ? "bg-accent" : "bg-gray-600"
                          }`}
                        >
                          <span
                            className={`block h-5 w-5 mt-0.5 ml-0.5 rounded-full bg-white shadow transform transition-transform duration-200 ease-in ${
                              isAutoStartEnabled
                                ? "translate-x-6"
                                : "translate-x-0"
                            }`}
                          />
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-md font-semibold mb-3 text-accent">
                  Data Management
                </h3>

                <div>
                  <button
                    onClick={() => setShowClearDataConfirm(true)}
                    className="w-full py-2 px-4 mt-2 text-danger border border-danger border-opacity-30 rounded-lg flex items-center justify-center gap-2 hover:bg-danger hover:bg-opacity-10 transition-colors"
                  >
                    <BiTrash className="text-xl" />
                    Clear All Data
                  </button>
                </div>
              </div>

              {!passwordProtected && (
                <div className="bg-accent bg-opacity-10 border border-accent border-opacity-20 rounded-lg p-3 mt-4">
                  <div className="flex items-start gap-3">
                    <BiInfoCircle className="text-xl text-accent flex-shrink-0 mt-0.5" />
                    <p className="text-sm">
                      <span className="font-medium text-accent">
                        Recommended:
                      </span>{" "}
                      Enable password protection to secure your authentication
                      tokens with encryption.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border-t border-dark-border flex justify-end">
            <button
              onClick={onClose}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
      <AnimatePresence>
        {showPasswordModal && (
          <PasswordModal
            isOpen={showPasswordModal}
            onClose={() => setShowPasswordModal(false)}
            onPasswordSet={handlePasswordSet}
            isPasswordSet={passwordProtected}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showClearDataConfirm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowClearDataConfirm(false)}
          >
            <motion.div
              className="bg-dark-surface rounded-xl overflow-hidden w-full max-w-md"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5">
                <h3 className="text-lg font-semibold text-danger mb-2">
                  Clear All Data?
                </h3>
                <p className="text-sm text-gray-300 mb-4">
                  This will permanently delete all your accounts and settings.
                  This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowClearDataConfirm(false)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClearData}
                    className="px-4 py-2 bg-danger hover:bg-danger-hover text-white rounded-lg"
                  >
                    Clear Data
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SettingsModal;
