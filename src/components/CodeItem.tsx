import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BiCopy,
  BiTrash,
  BiEditAlt,
  BiLowVision,
  BiShow,
} from "react-icons/bi";
import { CopyToClipboard } from "react-copy-to-clipboard";
import OTP from "otp";
import TimeCircle from "./TimeCircle";
import DeleteConfirmModal from "./modals/DeleteConfirmModal";
import { AuthAccount, TOTPCode } from "../types";

const generateTOTP = (account: AuthAccount): TOTPCode => {
  const cleanSecret = account.secret.replace(/\s+/g, "").toUpperCase();

  const epoch = Math.floor(Date.now() / 1000);
  const period = account.period || 30;
  const timeRemaining = period - (epoch % period);

  const otpInstance = new OTP({
    secret: cleanSecret,
    codeLength: 6,
    timeSlice: period,
    name: account.issuer ? `${account.issuer}:${account.name}` : account.name,
  });

  const code = otpInstance.totp(Date.now());

  return { code, timeRemaining, period };
};

interface CodeItemProps {
  account: AuthAccount;
  onDelete: (id: string) => void;
  onUpdate?: (account: AuthAccount) => void;
  streamerMode?: boolean;
}

const CodeItem: React.FC<CodeItemProps> = ({
  account,
  onDelete,
  onUpdate,
  streamerMode = false,
}) => {
  const [totpCode, setTotpCode] = useState<TOTPCode>(() =>
    generateTOTP(account),
  );
  const [showActions, setShowActions] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [prevCode, setPrevCode] = useState(totpCode.code);
  const [localHidden, setLocalHidden] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const codeFirstHalf = totpCode.code.slice(0, 3);
  const codeSecondHalf = totpCode.code.slice(3);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const newCode = generateTOTP(account);

      if (
        newCode.code !== prevCode &&
        newCode.timeRemaining === (account.period || 30)
      ) {
        setIsRefreshing(true);
        setTimeout(() => setIsRefreshing(false), 500);
        setPrevCode(newCode.code);

        if (onUpdate) {
          onUpdate({
            ...account,
            lastUsed: Date.now(),
          });
        }

        if (streamerMode) {
          setLocalHidden(true);
        }
      }

      setTotpCode(newCode);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [account, prevCode, onUpdate, streamerMode]);

  const handleCopy = () => {
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);

    if (onUpdate) {
      onUpdate({
        ...account,
        lastUsed: Date.now(),
      });
    }

    if (window.electronAPI?.notifyCodeCopied) {
      window.electronAPI.notifyCodeCopied();
    }
  };

  const toggleVisibility = () => {
    setLocalHidden(!localHidden);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    onDelete(account.id);
    setShowDeleteConfirm(false);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const isCodeHidden = streamerMode && localHidden;

  const accountColor = account.color || "#5C6BC0";

  const truncateText = (text: string, maxLength: number) => {
    if (!text) return "";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  const NAME_MAX_LENGTH = 25;
  const ISSUER_MAX_LENGTH = 20;

  return (
    <>
      <motion.div
        className="bg-dark-surface rounded-lg shadow-md overflow-hidden mb-3 relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <div
          className="absolute top-0 left-0 h-full w-1.5"
          style={{ backgroundColor: accountColor }}
        />

        <div className="p-3 pl-4 pb-8">
          {" "}
          <div className="flex justify-between items-start">
            <div className="mr-2 overflow-hidden">
              <h3
                className="font-medium truncate max-w-[230px]"
                title={account.name}
              >
                {truncateText(account.name, NAME_MAX_LENGTH)}
              </h3>
              {account.issuer && (
                <p
                  className="text-gray-400 text-xs truncate max-w-[230px]"
                  title={account.issuer}
                >
                  {truncateText(account.issuer, ISSUER_MAX_LENGTH)}
                </p>
              )}

              <div className="font-mono text-code font-semibold tracking-wider mt-1 flex items-center">
                {isCodeHidden ? (
                  <div className="flex items-center">
                    <div className="flex">
                      {Array(3)
                        .fill(0)
                        .map((_, index) => (
                          <div
                            key={`block-1-${index}`}
                            className="w-3.5 h-5 bg-black mx-0.5 rounded"
                          />
                        ))}
                    </div>
                    <span className="mx-1">·</span>
                    <div className="flex">
                      {Array(3)
                        .fill(0)
                        .map((_, index) => (
                          <div
                            key={`block-2-${index}`}
                            className="w-3.5 h-5 bg-black mx-0.5 rounded"
                          />
                        ))}
                    </div>

                    {streamerMode && (
                      <button
                        onClick={toggleVisibility}
                        className="ml-2 p-1 hover:bg-white hover:bg-opacity-10 rounded-full text-gray-300 hover:text-white transition-colors"
                      >
                        <BiShow size={14} />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center">
                    <div>
                      {Array.from(codeFirstHalf).map((char, index) => (
                        <span
                          key={`first-${index}`}
                          className={`code-char ${isRefreshing ? "refresh" : ""}`}
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          {char}
                        </span>
                      ))}
                      <span className="mx-1">·</span>
                      {Array.from(codeSecondHalf).map((char, index) => (
                        <span
                          key={`second-${index}`}
                          className={`code-char ${isRefreshing ? "refresh" : ""}`}
                          style={{ animationDelay: `${(index + 3) * 50}ms` }}
                        >
                          {char}
                        </span>
                      ))}
                    </div>

                    {streamerMode && (
                      <button
                        onClick={toggleVisibility}
                        className="ml-2 p-1 hover:bg-white hover:bg-opacity-10 rounded-full text-gray-300 hover:text-white transition-colors"
                      >
                        <BiLowVision size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <TimeCircle
                timeRemaining={totpCode.timeRemaining}
                period={account.period ?? 30}
                size={40}
                strokeWidth={3}
              />
            </div>
          </div>
          <AnimatePresence>
            {(showActions || isCopied) && (
              <motion.div
                className="absolute bottom-2 right-3 flex items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {isCopied ? (
                  <motion.div
                    className="text-xs text-success bg-success bg-opacity-10 px-2 py-1 rounded"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    Copied!
                  </motion.div>
                ) : (
                  <>
                    <CopyToClipboard text={totpCode.code} onCopy={handleCopy}>
                      <motion.button
                        className="p-1.5 hover:bg-white hover:bg-opacity-10 rounded-full text-gray-300 hover:text-white transition-colors"
                        whileTap={{ scale: 0.95 }}
                      >
                        <BiCopy size={16} />
                      </motion.button>
                    </CopyToClipboard>

                    <motion.button
                      className="p-1.5 hover:bg-white hover:bg-opacity-10 rounded-full text-gray-300 hover:text-white transition-colors"
                      whileTap={{ scale: 0.95 }}
                    >
                      <BiEditAlt size={16} />
                    </motion.button>

                    <motion.button
                      className="p-1.5 hover:bg-white hover:bg-opacity-10 rounded-full text-gray-300 hover:text-danger transition-colors"
                      whileTap={{ scale: 0.95 }}
                      onClick={handleDeleteClick}
                    >
                      <BiTrash size={16} />
                    </motion.button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <AnimatePresence>
        {showDeleteConfirm && (
          <DeleteConfirmModal
            isOpen={showDeleteConfirm}
            itemName={account.name}
            itemDetail={account.issuer}
            onConfirm={confirmDelete}
            onCancel={cancelDelete}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default CodeItem;
