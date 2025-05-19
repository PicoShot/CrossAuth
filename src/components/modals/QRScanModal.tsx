import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BiX, BiUpload, BiCamera, BiPlus } from "react-icons/bi";
import { AuthAccount, ModalProps } from "../../types";
import { parseOTPAuthURI } from "../../utils/authUtils";
import { parseGoogleAuthMigration } from "../../utils/googleAuthParser";
import jsQR, { QRCode } from "jsqr";

interface QRScanModalProps extends ModalProps {
  onAccountAdded: (account: AuthAccount) => void;
  onMultipleAccountsAdded?: (accounts: AuthAccount[]) => void;
}

const QRScanModal: React.FC<QRScanModalProps> = ({
  isOpen,
  onClose,
  onAccountAdded,
  onMultipleAccountsAdded,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<"camera" | "file">("file");
  const [isProcessing, setIsProcessing] = useState(false);
  const [foundAccounts, setFoundAccounts] = useState<AuthAccount[]>([]);
  const [showMultiAccountDialog, setShowMultiAccountDialog] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const [scanAnimationActive, setScanAnimationActive] = useState(false);

  const [lastDetectedCode, setLastDetectedCode] = useState<string | null>(null);
  const lastDetectionTime = useRef<number>(0);

  const preprocessImageData = (imageData: ImageData): ImageData => {
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      const newVal = avg < 120 ? 0 : 255;

      data[i] = newVal;
      data[i + 1] = newVal;
      data[i + 2] = newVal;
    }
    return imageData;
  };

  useEffect(() => {
    if (isOpen && scanMode === "camera" && !cameraActive) {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, scanMode]);

  const startCamera = useCallback(() => {
    setError(null);

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;

            videoRef.current.onloadedmetadata = () => {
              setCameraActive(true);
              setScanAnimationActive(true);
              startScanning();
            };
          }
        })
        .catch((err) => {
          console.error("Camera error:", err);
          setError(`Camera error: ${err.message || "Could not access camera"}`);
        });
    } else {
      setError("Camera access not supported in this browser");
    }
  }, []);

  const stopCamera = useCallback(() => {
    setCameraActive(false);
    setScanAnimationActive(false);

    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  }, []);

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

  const handleSuccessfulScan = useCallback(
    (qrContent: string) => {
      const now = Date.now();
      if (
        lastDetectedCode === qrContent &&
        now - lastDetectionTime.current < 2000
      ) {
        return;
      }

      setLastDetectedCode(qrContent);
      lastDetectionTime.current = now;

      try {
        console.log("QR code detected:", qrContent);
        setScanAnimationActive(false);

        if (videoRef.current) {
          videoRef.current.classList.add("detected");
          setTimeout(() => {
            if (videoRef.current) videoRef.current.classList.remove("detected");
          }, 300);
        }

        if (qrContent.startsWith("otpauth-migration://offline?")) {
          console.log("Detected Google Authenticator export QR code");

          const accounts = parseGoogleAuthMigration(qrContent);

          console.log(`Found ${accounts.length} accounts:`, accounts);

          if (accounts.length === 0) {
            setError(
              "Could not extract accounts from Google Authenticator export. Please try again.",
            );
            return;
          }

          if (onMultipleAccountsAdded && accounts.length > 1) {
            setFoundAccounts(accounts);
            setShowMultiAccountDialog(true);
            stopCamera();
            return;
          } else {
            for (const account of accounts) {
              onAccountAdded(account);
            }
            stopCamera();
            onClose();
            return;
          }
        }

        const accountInfo = parseOTPAuthURI(qrContent);

        if (!accountInfo || !accountInfo.secret) {
          setError("Invalid QR code format. Expected an OTP Auth URI.");
          setScanAnimationActive(true);
          return;
        }

        const newAccount: AuthAccount = {
          id: Date.now().toString(),
          name: accountInfo.name || "Unknown Account",
          issuer: accountInfo.issuer,
          secret: accountInfo.secret,
          digits: 6,
          period: accountInfo.period ?? 30,
          color: getRandomColor(),
          createdAt: Date.now(),
        };

        onAccountAdded(newAccount);
        stopCamera();
        onClose();
      } catch (err) {
        console.error("Error processing QR code:", err);
        setError("Could not process QR code. Please try again.");
        setScanAnimationActive(true);
      }
    },
    [
      onAccountAdded,
      onMultipleAccountsAdded,
      onClose,
      lastDetectedCode,
      stopCamera,
    ],
  );

  const scanQRCode = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !cameraActive) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx || video.videoWidth === 0 || video.videoHeight === 0) {
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    try {
      const scanRegionSize = 0.6;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const scanWidth = Math.floor(canvas.width * scanRegionSize);
      const scanHeight = Math.floor(canvas.height * scanRegionSize);
      const startX = Math.floor(centerX - scanWidth / 2);
      const startY = Math.floor(centerY - scanHeight / 2);

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(startX, startY, scanWidth, scanHeight);

      const processedImageData = preprocessImageData(imageData);

      let qrCode = jsQR(
        processedImageData.data,
        processedImageData.width,
        processedImageData.height,
        {
          inversionAttempts: "dontInvert",
        },
      );

      if (!qrCode) {
        qrCode = jsQR(
          processedImageData.data,
          processedImageData.width,
          processedImageData.height,
          {
            inversionAttempts: "invertFirst",
          },
        );
      }

      if (!qrCode) {
        const fullImageData = ctx.getImageData(
          0,
          0,
          canvas.width,
          canvas.height,
        );
        qrCode = jsQR(
          fullImageData.data,
          fullImageData.width,
          fullImageData.height,
          {
            inversionAttempts: "attemptBoth",
          },
        );
      }

      if (qrCode && qrCode.data) {
        console.log("QR detected:", qrCode.data.substring(0, 30) + "...");
        if (
          qrCode.data.startsWith("otpauth://") ||
          qrCode.data.startsWith("otpauth-migration://")
        ) {
          handleSuccessfulScan(qrCode.data);
        } else {
          console.log("QR found but not an auth URI");
        }
      }
    } catch (err) {
      console.error("Error in QR scanning:", err);
    }
  }, [cameraActive, handleSuccessfulScan, preprocessImageData]);

  const startScanning = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }

    scanIntervalRef.current = window.setInterval(() => {
      scanQRCode();
    }, 250);
  }, [scanQRCode]);

  const handleImportAllAccounts = () => {
    if (onMultipleAccountsAdded && foundAccounts.length > 0) {
      onMultipleAccountsAdded(foundAccounts);
      setShowMultiAccountDialog(false);
      onClose();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }

    const file = e.target.files[0];
    setIsProcessing(true);
    setError(null);

    const fileUrl = URL.createObjectURL(file);

    const img = new Image();
    img.src = fileUrl;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        setError("Could not process image");
        setIsProcessing(false);
        URL.revokeObjectURL(fileUrl);
        return;
      }

      let targetWidth = img.width;
      let targetHeight = img.height;

      const MAX_DIMENSION = 1200;
      if (targetWidth > MAX_DIMENSION || targetHeight > MAX_DIMENSION) {
        if (targetWidth > targetHeight) {
          targetHeight = Math.floor(
            targetHeight * (MAX_DIMENSION / targetWidth),
          );
          targetWidth = MAX_DIMENSION;
        } else {
          targetWidth = Math.floor(
            targetWidth * (MAX_DIMENSION / targetHeight),
          );
          targetHeight = MAX_DIMENSION;
        }
      }

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      try {
        let qrCode: QRCode | null = null;
        let attempts = 0;
        const maxAttempts = 3;

        while (!qrCode && attempts < maxAttempts) {
          let imageData: ImageData;
          attempts++;

          if (attempts === 1) {
            imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert",
            });
          } else if (attempts === 2) {
            imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "invertFirst",
            });
          } else {
            imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
              const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
              const newVal = avg < 120 ? 0 : 255;

              data[i] = newVal;
              data[i + 1] = newVal;
              data[i + 2] = newVal;
            }

            qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "attemptBoth",
            });
          }
        }

        URL.revokeObjectURL(fileUrl);

        if (qrCode) {
          console.log("Found QR code in image:", qrCode.data);

          if (
            qrCode.data.startsWith("otpauth://") ||
            qrCode.data.startsWith("otpauth-migration://")
          ) {
            handleSuccessfulScan(qrCode.data);
            setIsProcessing(false);
            return;
          } else {
            setError(
              "QR code found, but it is not an authenticator code. Please use a valid authenticator QR code.",
            );
          }
        } else {
          setError(
            "No QR code found in the image. Please try a different image or ensure the QR code is clearly visible.",
          );
        }
      } catch (imageError) {
        console.error("Error processing image:", imageError);
        setError("Error processing image. Please try a different image.");
      }

      setIsProcessing(false);
    };

    img.onerror = () => {
      setError("Failed to load image. Please try a different file.");
      setIsProcessing(false);
      URL.revokeObjectURL(fileUrl);
    };

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSelectFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleTabChange = (newMode: "camera" | "file") => {
    if (newMode === scanMode) return;

    stopCamera();
    setError(null);
    setScanMode(newMode);

    if (newMode === "camera") {
      setTimeout(() => {
        startCamera();
      }, 300);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => {
        stopCamera();
        onClose();
      }}
    >
      <AnimatePresence>
        {showMultiAccountDialog ? (
          <MultiAccountDialog
            accounts={foundAccounts}
            onImportAll={handleImportAllAccounts}
            onCancel={() => {
              setShowMultiAccountDialog(false);
              onClose();
            }}
            onSelectAccount={(account) => {
              onAccountAdded(account);
              setShowMultiAccountDialog(false);
              onClose();
            }}
          />
        ) : (
          <motion.div
            className="bg-dark-surface rounded-xl overflow-hidden w-full max-w-md"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-dark-border">
              <h2 className="text-lg font-semibold">Import QR Code</h2>
              <button
                onClick={() => {
                  stopCamera();
                  onClose();
                }}
                className="rounded-full p-1 hover:bg-white hover:bg-opacity-10 transition-colors"
              >
                <BiX className="text-2xl" />
              </button>
            </div>

            <div className="flex border-b border-dark-border">
              <button
                className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 ${
                  scanMode === "file"
                    ? "text-accent border-b-2 border-accent"
                    : "text-gray-400 hover:text-white"
                }`}
                onClick={() => handleTabChange("file")}
              >
                <BiUpload className="text-lg" />
                From File
              </button>
              <button
                className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 ${
                  scanMode === "camera"
                    ? "text-accent border-b-2 border-accent"
                    : "text-gray-400 hover:text-white"
                }`}
                onClick={() => handleTabChange("camera")}
              >
                <BiCamera className="text-lg" />
                Camera
              </button>
            </div>

            <div className="p-4">
              <AnimatePresence mode="wait">
                {scanMode === "camera" ? (
                  <motion.div
                    key="camera-mode"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="relative rounded-lg overflow-hidden bg-black aspect-square mb-4">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover transition-all duration-300"
                      />

                      <canvas ref={canvasRef} className="hidden" />

                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute inset-0 border border-accent opacity-70"></div>

                        {scanAnimationActive && (
                          <motion.div
                            className="absolute top-0 left-0 right-0 h-1 bg-accent"
                            initial={{ y: 0 }}
                            animate={{ y: "100vh" }}
                            transition={{
                              repeat: Infinity,
                              duration: 2,
                              ease: "linear",
                            }}
                          />
                        )}

                        <div className="absolute inset-0 flex items-center justify-center">
                          <motion.div
                            className="w-48 h-48 border-2 border-accent rounded-lg"
                            animate={{
                              boxShadow: [
                                "0 0 0 0 rgba(92, 107, 192, 0)",
                                "0 0 0 6px rgba(92, 107, 192, 0.3)",
                              ],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              repeatType: "loop",
                            }}
                          >
                            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-accent"></div>
                            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-accent"></div>
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-accent"></div>
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-accent"></div>
                          </motion.div>
                        </div>
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2 text-center">
                        <p className="text-sm text-white">
                          This feature is experimental and may not work.
                        </p>
                      </div>
                    </div>

                    {error && (
                      <div className="text-danger text-sm mb-4 text-center bg-danger bg-opacity-10 p-2 rounded-lg w-full">
                        {error}
                      </div>
                    )}

                    {!cameraActive && (
                      <div className="text-center p-4">
                        <div className="w-8 h-8 border-4 border-t-accent border-r-accent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-sm text-gray-400">
                          Activating camera...
                        </p>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="file-mode"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />

                    <div className="flex flex-col items-center justify-center p-6 bg-dark-bg rounded-lg mb-4">
                      <BiUpload className="text-5xl text-gray-400 mb-4" />

                      {isProcessing ? (
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 border-4 border-t-accent border-r-accent border-b-transparent border-l-transparent rounded-full animate-spin mb-4"></div>
                          <p className="text-sm text-gray-400">
                            Processing image...
                          </p>
                        </div>
                      ) : (
                        <>
                          <p className="text-center text-sm text-gray-400 mb-4">
                            Select an image containing a QR code to import your
                            authenticator account.
                          </p>

                          {error && (
                            <div className="text-danger text-sm mb-4 text-center bg-danger bg-opacity-10 p-2 rounded-lg w-full">
                              {error}
                            </div>
                          )}

                          <motion.button
                            className="bg-accent hover:bg-accent-hover text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSelectFile}
                          >
                            <BiUpload className="text-xl" />
                            Select Image
                          </motion.button>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="text-sm text-gray-400">
                <p className="mb-2">You can import QR codes from:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Google Authenticator export (multiple accounts)</li>
                  <li>Website or service 2FA setup pages</li>
                  <li>Screenshots of authenticator QR codes</li>
                  <li>Backup codes from other authenticator apps</li>
                </ul>
              </div>
            </div>

            <div className="p-4 border-t border-dark-border flex justify-end">
              <button
                onClick={() => {
                  stopCamera();
                  onClose();
                }}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

interface MultiAccountDialogProps {
  accounts: AuthAccount[];
  onImportAll: () => void;
  onCancel: () => void;
  onSelectAccount: (account: AuthAccount) => void;
}

const MultiAccountDialog: React.FC<MultiAccountDialogProps> = ({
  accounts,
  onImportAll,
  onCancel,
  onSelectAccount,
}) => {
  return (
    <motion.div
      className="bg-dark-surface rounded-xl overflow-hidden w-full max-w-md"
      initial={{ scale: 0.9, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0.9, y: 20 }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center p-4 border-b border-dark-border">
        <h2 className="text-lg font-semibold">Multiple Accounts Found</h2>
        <button
          onClick={onCancel}
          className="rounded-full p-1 hover:bg-white hover:bg-opacity-10 transition-colors"
        >
          <BiX className="text-2xl" />
        </button>
      </div>

      <div className="p-4">
        <p className="text-sm text-gray-400 mb-4">
          Found {accounts.length} accounts in Google Authenticator export. You
          can import all accounts or select individual accounts to import.
        </p>

        <div className="max-h-64 overflow-y-auto mb-4">
          {accounts.map((account, index) => (
            <div
              key={`account-${index}`}
              className="bg-dark-bg rounded-lg p-3 mb-2 flex justify-between items-center"
            >
              <div>
                <div className="font-medium">
                  {account.name || "Unknown Account"}
                </div>
                {account.issuer && (
                  <div className="text-sm text-gray-400">{account.issuer}</div>
                )}
              </div>
              <motion.button
                className="bg-accent hover:bg-accent-hover text-white rounded-full p-1"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelectAccount(account)}
              >
                <BiPlus className="text-lg" />
              </motion.button>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-dark-border flex justify-between">
        <button
          onClick={onCancel}
          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Cancel
        </button>

        <button
          onClick={onImportAll}
          className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          Import All
        </button>
      </div>
    </motion.div>
  );
};

export default QRScanModal;
