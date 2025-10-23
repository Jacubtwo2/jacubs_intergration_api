import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto';

let bcrypt: typeof import('bcrypt') | undefined;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  bcrypt = require('bcrypt');
} catch (error) {
  bcrypt = undefined;
}

const scrypt = (password: string, salt: string, keylen: number) =>
  new Promise<Buffer>((resolve, reject) => {
    scryptCallback(password, salt, keylen, (err, derivedKey) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(derivedKey);
    });
  });

export async function hashPassword(value: string, saltRounds: number): Promise<string> {
  if (bcrypt) {
    return bcrypt.hash(value, saltRounds);
  }

  const salt = randomBytes(16).toString('hex');
  const iterations = Math.max(1, Math.floor(saltRounds));
  let payload = value;

  for (let i = 1; i < iterations; i += 1) {
    payload += value;
  }

  const derivedKey = await scrypt(payload, salt, 64);
  return `fallback:${iterations}:${salt}:${derivedKey.toString('hex')}`;
}

export async function verifyPassword(value: string, hash: string): Promise<boolean> {
  if (bcrypt) {
    return bcrypt.compare(value, hash);
  }

  if (!hash.startsWith('fallback:')) {
    return false;
  }

  const [, roundsPart, salt, storedHash] = hash.split(':');

  if (!roundsPart || !salt || !storedHash) {
    return false;
  }

  const iterations = Number.parseInt(roundsPart, 10);
  if (!Number.isFinite(iterations) || iterations < 1) {
    return false;
  }

  let payload = value;
  for (let i = 1; i < iterations; i += 1) {
    payload += value;
  }

  const derivedKey = await scrypt(payload, salt, 64);
  return timingSafeEqual(Buffer.from(storedHash, 'hex'), derivedKey);
}
