import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { BiX, BiImport, BiFile } from "react-icons/bi";
import { AuthAccount, ModalProps } from "../../types";

interface ImportModalProps extends ModalProps {
  onImport: (accounts: AuthAccount[]) => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ onClose, onImport }) => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
      setImportedCount(null);
    }
  };

  const handleSelectFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const processFile = () => {
    if (!file) {
      setError("Please select a file to import");
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const accounts = JSON.parse(content);

        if (!Array.isArray(accounts)) {
          setError("Invalid file format. Expected an array of accounts.");
          return;
        }

        const validAccounts = accounts.filter(
          (acc) =>
            acc &&
            typeof acc === "object" &&
            acc.name &&
            acc.secret &&
            typeof acc.name === "string" &&
            typeof acc.secret === "string",
        );

        if (validAccounts.length === 0) {
          setError("No valid accounts found in the file.");
          return;
        }

        const processedAccounts = validAccounts.map((acc) => ({
          id:
            acc.id ||
            Date.now().toString() + Math.random().toString(36).substring(2, 9),
          name: acc.name,
          issuer: acc.issuer || undefined,
          secret: acc.secret,
          algorithm: acc.algorithm || "SHA1",
          digits: 6,
          period: acc.period || 30,
          color: acc.color || getRandomColor(),
          createdAt: acc.createdAt || Date.now(),
        }));

        onImport(processedAccounts);
        setImportedCount(processedAccounts.length);

        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (err) {
        console.error("Error parsing import file:", err);
        setError(
          "Failed to parse the file. Please ensure it is a valid JSON file.",
        );
      }
    };

    reader.onerror = () => {
      setError("Failed to read the file. Please try again.");
    };

    reader.readAsText(file);
  };

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
          <h2 className="text-lg font-semibold">Import Accounts</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-white hover:bg-opacity-10 transition-colors"
          >
            <BiX className="text-2xl" />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-4">
            <p className="text-sm text-gray-400 mb-4">
              Import accounts from a backup file (.json). This will add accounts
              to your existing ones without duplicates.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              className="hidden"
              onChange={handleFileChange}
            />

            <div
              className="border-2 border-dashed border-dark-border rounded-lg p-6 text-center cursor-pointer hover:border-accent transition-colors"
              onClick={handleSelectFile}
            >
              <BiFile className="mx-auto text-4xl mb-2 text-gray-400" />

              {file ? (
                <div className="text-accent">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-xs">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <p className="text-gray-400">
                  Click to select a backup file <br />
                  <span className="text-xs">(.json format)</span>
                </p>
              )}
            </div>

            {error && (
              <div className="mt-4 p-3 bg-danger bg-opacity-10 border border-danger border-opacity-20 rounded-lg text-sm text-danger">
                {error}
              </div>
            )}

            {importedCount !== null && (
              <div className="mt-4 p-3 bg-success bg-opacity-10 border border-success border-opacity-20 rounded-lg text-sm text-success">
                Successfully imported {importedCount} account
                {importedCount !== 1 ? "s" : ""}!
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-dark-border flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>

          <motion.button
            onClick={processFile}
            className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            disabled={!file}
          >
            <BiImport className="text-xl" />
            Import
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ImportModal;
