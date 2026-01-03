
import CryptoJS from 'crypto-js';

export const encryptSecret = (secret: string, password: string): string => {
  return CryptoJS.AES.encrypt(secret, password).toString();
};

export const decryptSecret = (encrypted: string, password: string): string => {
  const bytes = CryptoJS.AES.decrypt(encrypted, password);
  return bytes.toString(CryptoJS.enc.Utf8);
};

export const hashPassword = (password: string): string => {
  return CryptoJS.SHA256(password).toString();
};
