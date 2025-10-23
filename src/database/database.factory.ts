import { DatabaseConnectionConfig } from './database.config';

const toNumber = (value: string | undefined, fallback: number): number => {
  if (value === undefined) {
    return fallback;
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return fallback;
  }

  const parsed = Number(trimmed);

  return Number.isFinite(parsed) ? parsed : fallback;
};

const toBoolean = (value: string | undefined, fallback = false): boolean => {
  if (value === undefined) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized.length === 0) {
    return fallback;
  }

  if (['true', '1', 'yes', 'on'].includes(normalized)) {
    return true;
  }

  if (['false', '0', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return fallback;
};

const toOptionalString = (value: string | undefined): string | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
};

export const databaseConnectionFactory = (): DatabaseConnectionConfig => {
  const {
    DB_TYPE,
    DB_HOST,
    DB_PORT,
    DB_USER,
    DB_PASSWORD,
    DB_NAME,
    DB_SSL,
    DB_POOL_MIN,
    DB_POOL_MAX,
    DB_CONNECTION_TIMEOUT,
    DB_IDLE_TIMEOUT,
  } = process.env;

  return {
    type: toOptionalString(DB_TYPE) ?? 'postgres',
    host: toOptionalString(DB_HOST) ?? 'localhost',
    port: toNumber(DB_PORT, 5432),
    username: toOptionalString(DB_USER),
    password: toOptionalString(DB_PASSWORD),
    database: toOptionalString(DB_NAME),
    ssl: toBoolean(DB_SSL, false),
    pool: {
      min: toNumber(DB_POOL_MIN, 2),
      max: toNumber(DB_POOL_MAX, 10),
      connectionTimeoutMillis: toNumber(DB_CONNECTION_TIMEOUT, 60000),
      idleTimeoutMillis: toNumber(DB_IDLE_TIMEOUT, 30000),
    },
  };
};
