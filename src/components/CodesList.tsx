import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BiSearch, BiPlus, BiLowVision } from "react-icons/bi";
import CodeItem from "./CodeItem";
import ActionsMenu from "./ActionsMenu";
import AddAccountOptionsModal from "./modals/AddAccountOptionsModal";
import { AuthAccount } from "../types";

interface CodesListProps {
  accounts: AuthAccount[];
  onDelete: (id: string) => void;
  onUpdate: (account: AuthAccount) => void;
  onMenuAction: (action: string) => void;
  streamerMode?: boolean;
}

const CodesList: React.FC<CodesListProps> = ({
  accounts,
  onDelete,
  onUpdate,
  onMenuAction,
  streamerMode = false,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddOptions, setShowAddOptions] = useState(false);

  const filteredAccounts = accounts.filter(
    (account) =>
      account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (account.issuer &&
        account.issuer.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const handleAddAccount = () => {
    setShowAddOptions(true);
  };

  const handleOptionSelect = (option: string) => {
    setShowAddOptions(false);
    onMenuAction(option);
  };

  return (
    <div className="h-full flex flex-col">
      {accounts.length > 0 && (
        <motion.div
          className="mb-3 relative"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                className="w-full bg-dark-surface border border-dark-border rounded-lg px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Search accounts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <BiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>

            {streamerMode && (
              <div className="flex items-center bg-danger bg-opacity-20 px-3 py-1 rounded-lg border border-danger border-opacity-30">
                <BiLowVision className="text-danger mr-2" />
                <span className="text-sm font-medium text-danger">
                  Streamer Mode
                </span>
              </div>
            )}

            <ActionsMenu onMenuAction={onMenuAction} />
          </div>
        </motion.div>
      )}

      <div className="flex-1 overflow-y-auto pb-4">
        <AnimatePresence>
          {filteredAccounts.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.1 }}
            >
              {filteredAccounts.map((account, index) => (
                <motion.div
                  key={account.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <CodeItem
                    account={account}
                    onDelete={onDelete}
                    onUpdate={onUpdate}
                    streamerMode={streamerMode}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              className="h-full flex flex-col items-center justify-center text-center text-gray-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {accounts.length === 0 ? (
                <>
                  <svg
                    className="w-24 h-24 mb-4 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  <h3 className="text-xl font-medium mb-2">No accounts yet</h3>
                  <p className="text-sm max-w-xs mb-6">
                    Add your first authentication account by clicking the button
                    below.
                  </p>
                  <motion.button
                    className="flex items-center gap-2 bg-accent hover:bg-accent-hover px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddAccount}
                  >
                    <BiPlus className="text-xl" />
                    Add Account
                  </motion.button>
                </>
              ) : (
                <>
                  <svg
                    className="w-16 h-16 mb-4 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <h3 className="text-lg font-medium mb-2">No results found</h3>
                  <p className="text-sm max-w-xs">
                    No accounts match your search query. Try a different search
                    term.
                  </p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showAddOptions && (
          <AddAccountOptionsModal
            isOpen={showAddOptions}
            onClose={() => setShowAddOptions(false)}
            onOptionSelect={handleOptionSelect}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CodesList;
