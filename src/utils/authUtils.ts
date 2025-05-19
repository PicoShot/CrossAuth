import * as OTPAuth from "otpauth";
import { AuthAccount } from "../types";

export const parseOTPAuthURI = (uri: string): Partial<AuthAccount> | null => {
  try {
    const parsedTotp = OTPAuth.URI.parse(uri);

    if (!parsedTotp || !parsedTotp.secret) {
      throw new Error("Invalid OTP URI");
    }

    const secret = parsedTotp.secret.base32;

    return {
      name: parsedTotp.label || "",
      issuer: parsedTotp.issuer,
      secret,
      algorithm: parsedTotp.algorithm as "SHA1" | "SHA256" | "SHA512",
      digits: 6,
      ...(parsedTotp instanceof OTPAuth.TOTP
        ? { period: parsedTotp.period }
        : {}),
    };
  } catch (error) {
    console.error("Error parsing OTP URI:", error);

    try {
      if (!uri.startsWith("otpauth://totp/")) {
        throw new Error("Invalid OTP URI format");
      }

      const url = new URL(uri);
      const pathLabel = decodeURIComponent(url.pathname.substring(1));

      const secret = url.searchParams.get("secret");
      const issuer = url.searchParams.get("issuer");
      const algorithm = url.searchParams.get("algorithm")?.toUpperCase();
      const period = url.searchParams.get("period");

      let name = pathLabel;
      let extractedIssuer = issuer;

      if (pathLabel.includes(":")) {
        const parts = pathLabel.split(":");
        extractedIssuer = extractedIssuer || parts[0].trim();
        name = parts[1].trim();
      }

      if (!secret) {
        throw new Error("Secret key is missing");
      }

      return {
        name,
        issuer: extractedIssuer ?? undefined,
        secret,
        algorithm: (algorithm as "SHA1" | "SHA256" | "SHA512") || "SHA1",
        digits:  6,
        period: period ? parseInt(period, 10) : 30,
      };
    } catch (fallbackError) {
      console.error("Fallback parsing also failed:", fallbackError);
      return null;
    }
  }
};

export const generateQRCodeURI = (account: AuthAccount): string => {
  const totp = new OTPAuth.TOTP({
    issuer: account.issuer,
    label: account.name,
    algorithm: (account.algorithm as "SHA1" | "SHA256" | "SHA512") || "SHA1",
    digits:  6,
    period: account.period || 30,
    secret: OTPAuth.Secret.fromBase32(account.secret),
  });

  return totp.toString();
};

export const verifyToken = (
  account: AuthAccount,
  token: string,
  window: number = 1,
): boolean => {
  try {
    const totp = new OTPAuth.TOTP({
      issuer: account.issuer,
      label: account.name,
      algorithm: (account.algorithm as "SHA1" | "SHA256" | "SHA512") || "SHA1",
      digits:  6,
      period: account.period || 30,
      secret: OTPAuth.Secret.fromBase32(account.secret),
    });

    const delta = totp.validate({ token, window });

    return delta !== null;
  } catch (error) {
    console.error("Error verifying token:", error);
    return false;
  }
};

export const isValidSecret = (secret: string): boolean => {
  try {
    const cleanSecret = secret.replace(/\s+/g, "").toUpperCase();

    OTPAuth.Secret.fromBase32(cleanSecret);

    return true;
  } catch (error) {
    return false;
  }
};
