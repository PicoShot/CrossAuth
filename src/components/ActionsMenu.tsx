import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BiDotsVerticalRounded,
  BiQr,
  BiPlus,
  BiImport,
  BiExport,
  BiCog,
} from "react-icons/bi";
import { MenuOption } from "../types";

interface ActionsMenuProps {
  onMenuAction: (action: string) => void;
}

const ActionsMenu: React.FC<ActionsMenuProps> = ({ onMenuAction }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const menuOptions: MenuOption[] = [
    {
      id: "scan-qr",
      label: "Scan QR Code",
      icon: <BiQr className="text-xl" />,
      action: () => {
        onMenuAction("scan-qr");
        setIsMenuOpen(false);
      },
    },
    {
      id: "manual-entry",
      label: "Manual Entry",
      icon: <BiPlus className="text-xl" />,
      action: () => {
        onMenuAction("manual-entry");
        setIsMenuOpen(false);
      },
    },
    {
      id: "import",
      label: "Import Accounts",
      icon: <BiImport className="text-xl" />,
      action: () => {
        onMenuAction("import");
        setIsMenuOpen(false);
      },
    },
    {
      id: "export",
      label: "Export Accounts",
      icon: <BiExport className="text-xl" />,
      action: () => {
        onMenuAction("export");
        setIsMenuOpen(false);
      },
    },
    {
      id: "settings",
      label: "Settings",
      icon: <BiCog className="text-xl" />,
      action: () => {
        onMenuAction("settings");
        setIsMenuOpen(false);
      },
    },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <motion.button
        className="p-2 rounded-full hover:bg-dark-border transition-colors duration-200"
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Menu"
      >
        <BiDotsVerticalRounded className="text-2xl" />
      </motion.button>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-dark-surface border border-dark-border overflow-hidden z-30"
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="py-1">
              {menuOptions.map((option) => (
                <motion.button
                  key={option.id}
                  className="w-full text-left px-4 py-3 flex items-center gap-3 text-sm hover:bg-opacity-20 hover:bg-white transition-colors duration-150"
                  onClick={option.action}
                  whileHover={{ x: 5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-accent">{option.icon}</span>
                  {option.label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ActionsMenu;
