import React, { useState } from "react";
import { motion } from "framer-motion";
import { BiX, BiCheck } from "react-icons/bi";
import { AuthAccount, ModalProps } from "../../types";

interface ManualEntryModalProps extends ModalProps {
  onAccountAdded: (account: AuthAccount) => void;
}

const ManualEntryModal: React.FC<ManualEntryModalProps> = ({
  onClose,
  onAccountAdded,
}) => {
  const [name, setName] = useState("");
  const [issuer, setIssuer] = useState("");
  const [secret, setSecret] = useState("");
  const [digits, setDigits] = useState<number>(6);
  const [period, setPeriod] = useState<number>(30);
  const [error, setError] = useState<string | null>(null);

  const getRandomColor = () => {
    const colors = [
      "#F44336",
      "#E91E63",
      "#9C27B0",
      "#673AB7",
      "#3F51B5",
      "#2196F3",
      "#03A9F4",
      "#00BCD4",
      "#009688",
      "#4CAF50",
      "#8BC34A",
      "#CDDC39",
      "#FFC107",
      "#FF9800",
      "#FF5722",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Account name is required");
      return;
    }

    if (!secret.trim()) {
      setError("Secret key is required");
      return;
    }

    const newAccount: AuthAccount = {
      id: Date.now().toString(),
      name: name.trim(),
      issuer: issuer.trim() || undefined,
      secret: secret.trim().replace(/\s+/g, "").toUpperCase(),
      digits,
      period,
      color: getRandomColor(),
      createdAt: Date.now(),
    };

    onAccountAdded(newAccount);
    onClose();
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
          <h2 className="text-lg font-semibold">Manual Entry</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-white hover:bg-opacity-10 transition-colors"
          >
            <BiX className="text-2xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-danger bg-opacity-10 border border-danger border-opacity-20 rounded-lg text-sm text-danger">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Account Name*
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="e.g. Gmail, GitHub"
              />
            </div>

            <div>
              <label
                htmlFor="issuer"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Service Provider (Optional)
              </label>
              <input
                type="text"
                id="issuer"
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="e.g. Google, Microsoft"
              />
            </div>

            <div>
              <label
                htmlFor="secret"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Secret Key*
              </label>
              <input
                type="text"
                id="secret"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent font-mono"
                placeholder="JBSWY3DPEHPK3PXP"
              />
              <p className="mt-1 text-xs text-gray-400">
                Enter the secret key provided by the service. Spaces and casing
                are ignored.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="digits"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Digits
                </label>
                <select
                  id="digits"
                  value={digits}
                  onChange={(e) => setDigits(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="6">6</option>
                  <option value="7">7</option>
                  <option value="8">8</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="period"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Period (s)
                </label>
                <select
                  id="period"
                  value={period}
                  onChange={(e) => setPeriod(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="30">30</option>
                  <option value="60">60</option>
                  <option value="90">90</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-transparent border border-dark-border hover:bg-dark-border rounded-lg transition-colors"
            >
              Cancel
            </button>
            <motion.button
              type="submit"
              className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg flex items-center gap-2 font-medium"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <BiCheck className="text-xl" />
              Add Account
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default ManualEntryModal;
