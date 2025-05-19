import React, { useState } from "react";
import { motion } from "framer-motion";
import { BiLock } from "react-icons/bi";
import { ModalProps } from "../../types";
import storageService from "../../services/storageService";

interface PasswordPromptModalProps extends ModalProps {
  onUnlock: () => void;
}

const PasswordPromptModal: React.FC<PasswordPromptModalProps> = ({
  onUnlock,
}) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!password) {
      setError("Please enter your password");
      setIsLoading(false);
      return;
    }

    try {
      const isValid = storageService.verifyPassword(password);

      if (isValid) {
        storageService.unlockWithPassword(password);
        setIsLoading(false);
        onUnlock();
      } else {
        setAttempts(attempts + 1);
        setIsLoading(false);
        setError(
          `Incorrect password. ${attempts >= 2 ? "Please try again carefully." : ""}`,
        );
      }
    } catch (err) {
      setIsLoading(false);
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-center w-full flex-1 p-4">
      <motion.div
        className="bg-dark-surface rounded-xl overflow-hidden w-full max-w-sm p-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-accent bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
            <BiLock className="text-3xl text-accent" />
          </div>
          <h2 className="text-xl font-semibold">Unlock Authenticator</h2>
          <p className="text-sm text-gray-400 mt-1">
            Enter your password to access your accounts
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-danger bg-opacity-10 border border-danger border-opacity-20 rounded-lg text-sm text-danger">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-3 bg-dark-bg border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-center"
              placeholder="Enter your password"
              autoFocus
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            className={`w-full py-3 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium transition-colors ${
              isLoading ? "opacity-70 cursor-not-allowed" : ""
            }`}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Unlocking...
              </span>
            ) : (
              "Unlock"
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default PasswordPromptModal;
