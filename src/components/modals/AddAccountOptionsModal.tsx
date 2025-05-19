import React from "react";
import { motion } from "framer-motion";
import { BiX, BiQr, BiPlus, BiImport } from "react-icons/bi";
interface AddAccountOptionsModalProps {
  onOptionSelect: (option: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const AddAccountOptionsModal: React.FC<AddAccountOptionsModalProps> = ({
  isOpen,
  onClose,
  onOptionSelect,
}) => {
  if (!isOpen) return null;

  const options = [
    {
      id: "scan-qr",
      title: "Scan QR Code",
      description: "Scan a QR code from a website or another device",
      icon: <BiQr className="text-4xl text-accent" />,
      action: () => onOptionSelect("scan-qr"),
    },
    {
      id: "manual-entry",
      title: "Manual Entry",
      description: "Enter the secret key and details manually",
      icon: <BiPlus className="text-4xl text-accent" />,
      action: () => onOptionSelect("manual-entry"),
    },
    {
      id: "import",
      title: "Import Accounts",
      description: "Import accounts from a backup file",
      icon: <BiImport className="text-4xl text-accent" />,
      action: () => onOptionSelect("import"),
    },
  ];

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
          <h2 className="text-lg font-semibold">Add Account</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-white hover:bg-opacity-10 transition-colors"
          >
            <BiX className="text-2xl" />
          </button>
        </div>

        <div className="p-4">
          <div className="space-y-3">
            {options.map((option) => (
              <motion.button
                key={option.id}
                className="w-full flex items-center p-4 bg-dark-bg hover:bg-opacity-80 rounded-lg transition-colors"
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.98 }}
                onClick={option.action}
              >
                <div className="flex-shrink-0 mr-4">{option.icon}</div>
                <div className="text-left">
                  <h3 className="font-medium">{option.title}</h3>
                  <p className="text-sm text-gray-400">{option.description}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-dark-border flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AddAccountOptionsModal;
