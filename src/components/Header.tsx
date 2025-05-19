import { motion } from "framer-motion";
import { BiX, BiMinus } from "react-icons/bi";
import { getCurrentWindow } from "@tauri-apps/api/window";

interface HeaderProps {
  onMenuAction?: (action: string) => void;
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ title = "CrossAuth" }) => {
  const appWindow = getCurrentWindow();
  const hide = (): Promise<void> => appWindow.hide();
  const minimize = (): Promise<void> => appWindow.minimize();

  return (
    <header
      className="w-full bg-dark-surface border-b border-dark-border py-1.5 px-2 flex justify-between items-center relative z-20 titlebar"
      style={
        {
          WebkitAppRegion: "drag",
          cursor: "move",
        } as React.CSSProperties
      }
    >
      <motion.h1
        className="text-lg font-semibold"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {title}
      </motion.h1>

      <div
        className="flex items-center"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        <div className="flex">
          <button
            onClick={() => minimize()}
            className="p-1.5 rounded-full hover:bg-dark-border transition-colors duration-200 text-gray-400 hover:text-white"
            title="Minimize"
          >
            <BiMinus className="text-lg" />
          </button>
          <button
            onClick={hide}
            className="p-1.5 rounded-full hover:bg-dark-border hover:text-red-500 transition-colors duration-200 text-gray-400"
            title="Hide to Tray"
          >
            <BiX className="text-lg" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
