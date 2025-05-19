import React, { useState } from "react";
import { motion } from "framer-motion";
import { BiX, BiLock, BiCheckCircle, BiErrorCircle } from "react-icons/bi";
import { ModalProps } from "../../types";
import storageService from "../../services/storageService";

interface PasswordModalProps extends ModalProps {
  onPasswordSet: (isEnabled: boolean) => void;
  isPasswordSet: boolean;
}

const PasswordModal: React.FC<PasswordModalProps> = ({
  onClose,
  onPasswordSet,
  isPasswordSet,
}) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (isPasswordSet && !currentPassword) {
      setError("Current password is required");
      return;
    }

    if (!isPasswordSet || (isPasswordSet && newPassword)) {
      if (newPassword.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }

      if (newPassword !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
    }

    // Verify current password if it's already set
    if (isPasswordSet) {
      const isValid = storageService.verifyPassword(currentPassword);
      if (!isValid) {
        setError("Current password is incorrect");
        return;
      }

      // If no new password, keep the current one
      if (!newPassword) {
        onClose();
        return;
      }
    }

    try {
      // Set the new password
      storageService.setCustomPassword(newPassword);
      onPasswordSet(true);
      onClose();
    } catch (err) {
      setError("Failed to set password. Please try again.");
    }
  };

  const handleRemovePassword = () => {
    if (!currentPassword) {
      setError("Please enter your current password to remove it");
      return;
    }

    const isValid = storageService.verifyPassword(currentPassword);
    if (!isValid) {
      setError("Current password is incorrect");
      return;
    }

    try {
      storageService.removeCustomPassword();
      onPasswordSet(false);
      onClose();
    } catch (err) {
      setError("Failed to remove password. Please try again.");
    }
  };

  return (
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
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BiLock className="text-accent" />
            {isPasswordSet ? "Change Password" : "Set Password"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-white hover:bg-opacity-10 transition-colors"
          >
            <BiX className="text-2xl" />
          </button>
        </div>

        {showRemoveConfirm ? (
          <div className="p-4">
            <div className="p-3 mb-4 bg-danger bg-opacity-10 border border-danger border-opacity-20 rounded-lg">
              <h3 className="font-medium text-danger mb-2 flex items-center gap-2">
                <BiErrorCircle />
                Remove Password Protection
              </h3>
              <p className="text-sm text-gray-300 mb-2">
                Removing password protection will make your authenticator codes
                accessible without any security. Your data will only be
                protected by device-level security.
              </p>
              <p className="text-sm text-gray-300">
                Are you sure you want to continue?
              </p>
            </div>

            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowRemoveConfirm(false)}
                className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRemovePassword}
                className="px-4 py-2 bg-danger hover:bg-danger-hover text-white rounded-lg"
              >
                Remove Password
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4">
            {error && (
              <div className="mb-4 p-3 bg-danger bg-opacity-10 border border-danger border-opacity-20 rounded-lg text-sm text-danger">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {isPasswordSet && (
                <div>
                  <label
                    htmlFor="current-password"
                    className="block text-sm font-medium text-gray-300 mb-1"
                  >
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="Enter current password"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="new-password"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  {isPasswordSet ? "New Password" : "Password"}
                </label>
                <input
                  type="password"
                  id="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder={
                    isPasswordSet ? "Enter new password" : "Enter password"
                  }
                />
                <p className="mt-1 text-xs text-gray-400">
                  Must be at least 6 characters long
                </p>
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            <div className="bg-accent bg-opacity-10 border border-accent border-opacity-20 rounded-lg p-3 mt-6">
              <div className="flex items-start gap-3">
                <BiCheckCircle className="text-xl text-accent flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="mb-1">
                    <span className="font-medium">Strong Protection:</span> Your
                    password will be used to encrypt all of your authenticator
                    accounts.
                  </p>
                  <p className="text-gray-400">
                    Remember your password! If you forget it, your accounts
                    cannot be recovered.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-between gap-3">
              {isPasswordSet && (
                <button
                  type="button"
                  onClick={() => setShowRemoveConfirm(true)}
                  className="px-4 py-2 text-danger border border-danger border-opacity-30 rounded-lg hover:bg-danger hover:bg-opacity-10 transition-colors"
                >
                  Remove Password
                </button>
              )}
              <div className={`flex gap-3 ${isPasswordSet ? "" : "ml-auto"}`}>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium"
                >
                  {isPasswordSet ? "Update Password" : "Set Password"}
                </button>
              </div>
            </div>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
};

export default PasswordModal;
