import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

type EncryptedPayloadV1 = {
  v: 1;
  alg: "aes-256-gcm";
  iv: string; // base64
  tag: string; // base64
  data: string; // base64
};

function deriveKey(keyMaterial: string) {
  // Accept arbitrary length input; derive fixed 32 bytes.
  return createHash("sha256").update(keyMaterial, "utf8").digest();
}

export function encryptSecret(plaintext: string) {
  const keyMaterial = process.env.TOKEN_ENCRYPTION_KEY;
  if (!keyMaterial) throw new Error("TOKEN_ENCRYPTION_KEY is required");

  const key = deriveKey(keyMaterial);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  const payload: EncryptedPayloadV1 = {
    v: 1,
    alg: "aes-256-gcm",
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    data: encrypted.toString("base64"),
  };

  return JSON.stringify(payload);
}

export function decryptSecret(payloadJson: string) {
  const keyMaterial = process.env.TOKEN_ENCRYPTION_KEY;
  if (!keyMaterial) throw new Error("TOKEN_ENCRYPTION_KEY is required");

  const payload = JSON.parse(payloadJson) as EncryptedPayloadV1;
  if (payload?.v !== 1 || payload?.alg !== "aes-256-gcm") {
    throw new Error("Unsupported encrypted payload");
  }

  const key = deriveKey(keyMaterial);
  const iv = Buffer.from(payload.iv, "base64");
  const tag = Buffer.from(payload.tag, "base64");
  const data = Buffer.from(payload.data, "base64");

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString("utf8");
}

