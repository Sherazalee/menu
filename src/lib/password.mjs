import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const derive = promisify(scrypt);
const options = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };

async function key(password, salt) {
  return derive(password, salt, 64, options);
}

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await key(password, salt);
  return `scrypt-v1:${salt.toString("hex")}:${hash.toString("hex")}`;
}

export async function verifyPassword(password, stored) {
  const match = /^scrypt-v1:([0-9a-f]{32}):([0-9a-f]{128})$/.exec(stored ?? "");
  const salt = match ? Buffer.from(match[1], "hex") : Buffer.alloc(16);
  const expected = match ? Buffer.from(match[2], "hex") : Buffer.alloc(64);
  const actual = await key(password, salt);
  return timingSafeEqual(actual, expected) && Boolean(match);
}

