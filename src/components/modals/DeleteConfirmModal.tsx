import React from "react";
import { motion } from "framer-motion";
import { BiTrash } from "react-icons/bi";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  itemName: string;
  itemDetail?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  itemName,
  itemDetail,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
    >
      <motion.div
        className="bg-dark-surface rounded-xl overflow-hidden w-full max-w-xs p-4"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-danger bg-opacity-20 p-2 rounded-full">
            <BiTrash className="text-xl text-danger" />
          </div>
          <h3 className="text-lg font-semibold">Delete Confirmation</h3>
        </div>

        <p className="text-sm text-gray-300 mb-4">
          Are you sure you want to delete{" "}
          <span className="font-medium">"{itemName}"</span>
          {itemDetail ? (
            <span className="text-gray-400"> ({itemDetail})</span>
          ) : (
            ""
          )}
          ? This action cannot be undone.
        </p>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 bg-danger hover:bg-danger-hover text-white rounded-lg text-sm"
          >
            Delete
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DeleteConfirmModal;
