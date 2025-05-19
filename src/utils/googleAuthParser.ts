import { AuthAccount } from "../types";
import * as protobuf from "protobufjs";

const protoDefinition = `
syntax = "proto3";

message MigrationPayload {
  enum Algorithm {
    ALGO_INVALID = 0;
    ALGO_SHA1 = 1;
  }

  enum OtpType {
    OTP_INVALID = 0;
    OTP_HOTP = 1;
    OTP_TOTP = 2;
  }

  message OtpParameters {
    bytes secret = 1;
    string name = 2;
    string issuer = 3;
    Algorithm algorithm = 4;
    int32 digits = 5;
    OtpType type = 6;
    int64 counter = 7;
  }

  repeated OtpParameters otp_parameters = 1;
  int32 version = 2;
  int32 batch_size = 3;
  int32 batch_index = 4;
  int32 batch_id = 5;
}`;

let protoRoot;
let MigrationPayload: protobuf.Type;

protoRoot = protobuf.parse(protoDefinition).root;
MigrationPayload = protoRoot.lookupType("MigrationPayload");

export function parseGoogleAuthMigration(uri: string): AuthAccount[] {
  if (!uri.startsWith("otpauth-migration://offline?")) {
    return [];
  }

  const url = new URL(uri);
  const data = url.searchParams.get("data");
  if (!data) return [];

  const base64 = decodeURIComponent(data).replace(/-/g, "+").replace(/_/g, "/");

  const binaryString = atob(base64);
  const buffer = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    buffer[i] = binaryString.charCodeAt(i);
  }

  return decodeProtobufPayload(buffer);
}

function decodeProtobufPayload(buffer: Uint8Array): AuthAccount[] {
  if (!MigrationPayload) {
    return [];
  }

  const message = MigrationPayload.decode(buffer);
  const decodedData = MigrationPayload.toObject(message, {
    longs: String,
    enums: String,
    bytes: Array,
  });
  const accounts: AuthAccount[] = [];

  if (decodedData.otpParameters && Array.isArray(decodedData.otpParameters)) {
    for (const param of decodedData.otpParameters) {
      if (param.secret && param.type === "OTP_TOTP") {
        const secret = convertToBase32(new Uint8Array(param.secret));

        accounts.push({
          id:
            Date.now().toString() + Math.random().toString(36).substring(2, 9),
          name: param.name || "Unknown Account",
          issuer: param.issuer || undefined,
          secret: secret,
          algorithm: param.algorithm === "ALGO_SHA1" ? "SHA1" : "SHA1",
          digits: param.digits || 6,
          period: 30,
          color: getRandomColor(),
          createdAt: Date.now(),
        });
      }
    }
  }
  return accounts;
}

function convertToBase32(data: Uint8Array): string {
  const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let result = "";
  let bits = 0;
  let value = 0;

  for (let i = 0; i < data.length; i++) {
    value = (value << 8) | data[i];
    bits += 8;

    while (bits >= 5) {
      result += CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    result += CHARS[(value << (5 - bits)) & 31];
  }

  return result;
}

function getRandomColor(): string {
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
}
