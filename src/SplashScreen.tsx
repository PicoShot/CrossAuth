import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BiLock, BiShield, BiKey, BiCheckCircle } from "react-icons/bi";
import { getCurrentWindow, getAllWindows } from "@tauri-apps/api/window";
import { register } from "@tauri-apps/plugin-global-shortcut";

const SplashScreen = () => {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showCheckmark, setShowCheckmark] = useState(false);
  const [loadingText, setLoadingText] = useState("Initializing...");

  const RegisterShortcut = async () => {
    const allWindows = await getAllWindows();
    await register("CommandOrControl+Alt+A", () => {
      const mainWindow = allWindows.find((window) => window.label === "main");
      if (mainWindow) {
        mainWindow.show();
        mainWindow.setFocus();
      }
    });
  };

  const closeSplashScreen = async () => {
    const splashWindow = getCurrentWindow();
    if (splashWindow) {
      await splashWindow.close();
    }
  };

  const openSplashScreen = async () => {
    const allWindows = await getAllWindows();
    const splashWindow = allWindows.find(
      (window) => window.label === "splashscreen"
    );
    if (splashWindow) {
      await splashWindow.show();
      await splashWindow.setFocus();
    }
  };

  const openMainWindow = async () => {
    const allWindows = await getAllWindows();
    const mainWindow = allWindows.find((window) => window.label === "main");
    if (mainWindow) {
      await mainWindow.show();
      await mainWindow.setFocus();
    }
  };

  useEffect(() => {
    openSplashScreen();
    RegisterShortcut();
    const loadingStages = [
      { progress: 20, text: "Preparing authentication..." },
      { progress: 80, text: "Ready to go!" },
    ];

    let currentStage = 0;

    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setShowCheckmark(true);
          return 100;
        }

        if (
          currentStage < loadingStages.length &&
          prev >= loadingStages[currentStage].progress
        ) {
          setLoadingText(loadingStages[currentStage].text);
          currentStage++;
        }

        return prev + 2;
      });
    }, 60);

    const timer = setTimeout(() => {
      openMainWindow();
      closeSplashScreen();
    }, 4500);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="w-full h-screen bg-dark-bg flex flex-col items-center justify-center overflow-hidden">
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-accent opacity-40 rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [Math.random() * -20, Math.random() * 20],
              x: [Math.random() * -20, Math.random() * 20],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              repeat: Infinity,
              duration: 3 + Math.random() * 5,
              ease: "easeInOut",
              repeatType: "reverse",
            }}
          />
        ))}
      </div>

      {/* Logo animation */}
      <motion.div
        className="relative mb-8"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Ring animation */}
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-accent opacity-20"
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Outer circle */}
        <motion.div
          className="w-32 h-32 rounded-full border-4 border-accent flex items-center justify-center"
          initial={{ rotate: -90 }}
          animate={{ rotate: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        >
          {/* Middle circle with pulse */}
          <motion.div
            className="w-24 h-24 bg-dark-surface rounded-full flex items-center justify-center"
            animate={{
              boxShadow: [
                "0 0 0 0px rgba(92, 107, 192, 0.2)",
                "0 0 0 10px rgba(92, 107, 192, 0)",
              ],
            }}
            transition={{ duration: 1.5, repeat: 3, repeatType: "loop" }}
          >
            {/* Inner content with shield and lock */}
            <AnimatePresence mode="wait">
              {!showCheckmark ? (
                <motion.div
                  className="relative"
                  key="loading"
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 6,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute inset-0 flex items-center justify-center opacity-20"
                  >
                    <BiKey className="text-5xl text-accent" />
                  </motion.div>

                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      repeatType: "loop",
                      ease: "easeInOut",
                    }}
                  >
                    <BiShield className="text-4xl text-accent" />
                  </motion.div>

                  <motion.div
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  >
                    <BiLock className="text-2xl text-white" />
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="complete"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, type: "spring" }}
                >
                  <BiCheckCircle className="text-4xl text-success" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* Orbital accent dots */}
        <motion.div
          className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none"
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        >
          <motion.div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full bg-accent" />
          <motion.div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full bg-accent" />
          <motion.div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-2 rounded-full bg-accent" />
          <motion.div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-2 rounded-full bg-accent" />
        </motion.div>
      </motion.div>

      {/* App name */}
      <motion.div
        className="mb-8"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold text-white tracking-wider">
          CrossAuth
        </h1>
        <motion.p
          className="text-xs text-gray-400 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          Secure Authentication
        </motion.p>
      </motion.div>

      {/* Loading bar */}
      <motion.div
        className="w-48 h-1 bg-dark-border rounded-full overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <motion.div
          className="h-full bg-accent"
          initial={{ width: "0%" }}
          animate={{ width: `${loadingProgress}%` }}
          transition={{ duration: 0.1 }}
        />
      </motion.div>

      {/* Loading status text with animation */}
      <motion.p
        className="text-xs text-gray-400 mt-2 h-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={loadingText}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            {loadingText}
          </motion.span>
        </AnimatePresence>
      </motion.p>
    </div>
  );
};

export default SplashScreen;
