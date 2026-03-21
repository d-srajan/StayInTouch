import * as Crypto from "expo-crypto";
import { Platform } from "react-native";

/**
 * Simple AES-like encryption using expo-crypto.
 * We XOR the plaintext with a key-derived stream for on-device backup encryption.
 * This is NOT military-grade crypto — it's a privacy layer so backups
 * on Google Drive aren't readable in plaintext.
 */

// Generate a random encryption key
export async function generateEncryptionKey(): Promise<string> {
  if (Platform.OS === "web") {
    // Web fallback — random hex string
    const arr = new Uint8Array(32);
    crypto.getRandomValues(arr);
    return Array.from(arr)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `sit-key-${Date.now()}-${Math.random()}`
  );
}

// Derive a deterministic stream from key for XOR
async function deriveStream(key: string, length: number): Promise<number[]> {
  const stream: number[] = [];
  let counter = 0;

  while (stream.length < length) {
    const chunk =
      Platform.OS === "web"
        ? await webDigest(`${key}-${counter}`)
        : await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            `${key}-${counter}`
          );
    // Each SHA-256 hex string is 64 chars = 32 bytes
    for (let i = 0; i < chunk.length - 1 && stream.length < length; i += 2) {
      stream.push(parseInt(chunk.substring(i, i + 2), 16));
    }
    counter++;
  }

  return stream;
}

async function webDigest(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Encrypt a string with the given key
export async function encrypt(
  plaintext: string,
  key: string
): Promise<string> {
  const bytes = new TextEncoder().encode(plaintext);
  const stream = await deriveStream(key, bytes.length);

  const encrypted = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    encrypted[i] = bytes[i] ^ stream[i];
  }

  // Convert to base64
  return uint8ToBase64(encrypted);
}

// Decrypt a base64 string with the given key
export async function decrypt(
  ciphertext: string,
  key: string
): Promise<string> {
  const encrypted = base64ToUint8(ciphertext);
  const stream = await deriveStream(key, encrypted.length);

  const decrypted = new Uint8Array(encrypted.length);
  for (let i = 0; i < encrypted.length; i++) {
    decrypted[i] = encrypted[i] ^ stream[i];
  }

  return new TextDecoder().decode(decrypted);
}

// Base64 helpers
function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
