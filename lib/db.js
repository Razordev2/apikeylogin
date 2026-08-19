import fs from 'fs';
import path from 'path';

const DB_FILE_PATH = path.join(process.cwd(), 'data', 'keys.json');
const DEFAULT_WEB_API_KEY = process.env.WEB_API_KEY || 'web_key_master_998877665544332211';

// Initial mock data
const DEFAULT_KEYS = [
  {
    id: 'key_1',
    username: 'alex_developer',
    key: 'tok_active_9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c',
    token: 'tok_active_9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c',
    alias: 'Web Admin Panel External',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    dayExpired: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    totalRequests: 142,
    lastUsedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'key_2',
    username: 'budi_santoso',
    key: 'tok_active_1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d',
    token: 'tok_active_1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d',
    alias: 'Panel Bot Admin',
    createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    dayExpired: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'expired',
    totalRequests: 890,
    lastUsedAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'key_3',
    username: 'citra_designer',
    key: 'tok_active_7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    token: 'tok_active_7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    alias: 'Client Panel App',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    dayExpired: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    totalRequests: 18,
    lastUsedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString()
  }
];

let memoryStore = null;

function ensureDirectoryExistence(filePath) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) return true;
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

function readData() {
  if (memoryStore) return memoryStore;

  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const rawData = fs.readFileSync(DB_FILE_PATH, 'utf8');
      memoryStore = JSON.parse(rawData);
    } else {
      memoryStore = [...DEFAULT_KEYS];
      writeData(memoryStore);
    }
  } catch (err) {
    if (!memoryStore) memoryStore = [...DEFAULT_KEYS];
  }

  return memoryStore;
}

function writeData(data) {
  memoryStore = data;
  try {
    ensureDirectoryExistence(DB_FILE_PATH);
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    // Vercel read-only fallback
  }
}

function computeDynamicStatus(item) {
  const now = new Date();
  const exp = new Date(item.expiresAt || item.dayExpired);
  if (item.status === 'revoked') return 'revoked';
  if (exp < now) return 'expired';
  return 'active';
}

function generateRandomKey(prefix = 'tok_active_') {
  const chars = 'abcdef0123456789';
  let randomPart = '';
  for (let i = 0; i < 32; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}${randomPart}`;
}

export function getWebMasterApiKey() {
  return DEFAULT_WEB_API_KEY;
}

export function getAllKeys() {
  const keys = readData();
  let updated = false;

  const processed = keys.map((item) => {
    const computed = computeDynamicStatus(item);
    if (computed !== item.status) {
      item.status = computed;
      updated = true;
    }
    const now = new Date().getTime();
    const exp = new Date(item.expiresAt || item.dayExpired).getTime();
    const diffMs = exp - now;
    const daysRemaining = diffMs > 0 ? Math.ceil(diffMs / (1000 * 60 * 60 * 24)) : 0;

    return {
      ...item,
      token: item.key || item.token,
      dayExpired: item.expiresAt || item.dayExpired,
      daysRemaining
    };
  });

  if (updated) writeData(keys);

  return processed;
}

export function createKey({ username, alias, durationDays }) {
  const keys = readData();
  const days = parseInt(durationDays, 10) || 30;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  const tokenString = generateRandomKey('tok_active_');

  const newKeyRecord = {
    id: `key_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    username: username.trim(),
    key: tokenString,
    token: tokenString,
    alias: alias ? alias.trim() : 'Website Panel Integration',
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    dayExpired: expiresAt.toISOString(),
    status: 'active',
    totalRequests: 0,
    lastUsedAt: null
  };

  keys.unshift(newKeyRecord);
  writeData(keys);

  return {
    ...newKeyRecord,
    user: newKeyRecord.username,
    token: newKeyRecord.token,
    dayExpired: newKeyRecord.dayExpired,
    daysRemaining: days
  };
}

export function addDaysToKey(keyIdentifier, extraDays) {
  const keys = readData();
  const index = keys.findIndex((k) => k.id === keyIdentifier || k.key === keyIdentifier || k.token === keyIdentifier);

  if (index === -1) {
    throw new Error('User / Token tidak ditemukan');
  }

  const daysToAdd = parseInt(extraDays, 10);
  if (isNaN(daysToAdd) || daysToAdd <= 0) {
    throw new Error('Jumlah hari tambahan harus lebih besar dari 0');
  }

  const item = keys[index];
  const now = new Date();
  let baseDate = new Date(item.expiresAt || item.dayExpired);

  if (baseDate < now) {
    baseDate = now;
  }

  const newExpiresAt = new Date(baseDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  item.expiresAt = newExpiresAt.toISOString();
  item.dayExpired = newExpiresAt.toISOString();

  if (item.status === 'expired') {
    item.status = 'active';
  }

  writeData(keys);

  const diffMs = newExpiresAt.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return {
    ...item,
    user: item.username,
    token: item.key || item.token,
    dayExpired: item.dayExpired,
    daysRemaining,
    tambahanDay: daysToAdd
  };
}

export function updateKeyStatus(keyId, newStatus) {
  const keys = readData();
  const item = keys.find((k) => k.id === keyId || k.key === keyId || k.token === keyId);

  if (!item) {
    throw new Error('API Key / Token tidak ditemukan');
  }

  if (!['active', 'revoked'].includes(newStatus)) {
    throw new Error('Status tidak valid');
  }

  item.status = newStatus;
  writeData(keys);
  return {
    ...item,
    user: item.username,
    token: item.key || item.token,
    dayExpired: item.expiresAt || item.dayExpired
  };
}

export function regenerateApiKey(keyId) {
  const keys = readData();
  const item = keys.find((k) => k.id === keyId || k.key === keyId || k.token === keyId);

  if (!item) {
    throw new Error('Token tidak ditemukan');
  }

  const newToken = generateRandomKey('tok_active_');
  item.key = newToken;
  item.token = newToken;
  writeData(keys);

  return {
    ...item,
    user: item.username,
    token: newToken,
    dayExpired: item.expiresAt || item.dayExpired
  };
}

export function deleteKey(keyId) {
  let keys = readData();
  const initialLength = keys.length;
  keys = keys.filter((k) => k.id !== keyId && k.key !== keyId && k.token !== keyId);

  if (keys.length === initialLength) {
    throw new Error('Token tidak ditemukan');
  }

  writeData(keys);
  return { success: true };
}

export function validateIntegratedPipeline({ webApiKey, userToken, username }) {
  const masterWebKey = getWebMasterApiKey();
  if (webApiKey && webApiKey.trim() !== masterWebKey && webApiKey.trim() !== 'default') {
    return {
      status: 'FAILED',
      success: false,
      valid: false,
      message: 'INTEGRATION FAILED: Web API Key Website tidak valid!'
    };
  }

  if (!userToken && !username) {
    return {
      status: 'FAILED',
      success: false,
      valid: false,
      message: 'INTEGRATION FAILED: Masukkan token atau username yang akan di-validate'
    };
  }

  const keys = readData();
  const item = keys.find(
    (k) =>
      (userToken && (k.key === userToken.trim() || k.token === userToken.trim())) ||
      (username && k.username.toLowerCase() === username.trim().toLowerCase())
  );

  if (!item) {
    return {
      status: 'FAILED',
      success: false,
      valid: false,
      message: 'INTEGRATION FAILED: Data User / Token tidak ditemukan di database'
    };
  }

  const now = new Date();
  const exp = new Date(item.expiresAt || item.dayExpired);

  if (item.status === 'revoked') {
    return {
      status: 'REVOKED',
      success: false,
      valid: false,
      user: item.username,
      token: item.key || item.token,
      dayExpired: item.dayExpired || item.expiresAt,
      message: 'INTEGRATION FAILED: Token/User telah dicabut (Revoked)'
    };
  }

  if (exp < now) {
    item.status = 'expired';
    writeData(keys);
    return {
      status: 'EXPIRED',
      success: false,
      valid: false,
      user: item.username,
      token: item.key || item.token,
      dayExpired: item.dayExpired || item.expiresAt,
      daysRemaining: 0,
      message: 'INTEGRATION FAILED: Token/User telah masa kadaluarsa (Expired)'
    };
  }

  item.totalRequests = (item.totalRequests || 0) + 1;
  item.lastUsedAt = now.toISOString();
  writeData(keys);

  const diffMs = exp.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return {
    status: 'SUCCESS',
    success: true,
    valid: true,
    webApiKey: masterWebKey,
    dataUser: {
      user: item.username,
      token: item.key || item.token,
      alias: item.alias,
      status: 'active',
      daysRemaining,
      dayExpired: item.dayExpired || item.expiresAt
    },
    user: item.username,
    token: item.key || item.token,
    daysRemaining,
    dayExpired: item.dayExpired || item.expiresAt,
    message: 'INTEGRATION SUCCESS: Web API Key & User Token Valid & Aktif!'
  };
}

export function validateApiKey(apiKeyValue) {
  return validateIntegratedPipeline({ userToken: apiKeyValue });
}
