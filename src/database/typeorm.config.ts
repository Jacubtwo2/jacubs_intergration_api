import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import { databaseConnectionFactory } from './database.factory';
import { User } from '../users/entities/user.entity';

const TEST_DB_FILE = ':memory:';

const MIGRATIONS = [join(__dirname, 'migrations/*.{ts,js}')];

export function buildTypeOrmModuleOptions(
  configService: ConfigService,
): TypeOrmModuleOptions {
  const nodeEnv = configService.get<string>('NODE_ENV');

  if (nodeEnv === 'test') {
    return {
      type: 'sqlite',
      database: TEST_DB_FILE,
      dropSchema: true,
      entities: [User],
      synchronize: true,
    };
  }

  const databaseUrl = configService.get<string>('DATABASE_URL');
  const normalizedUrl =
    typeof databaseUrl === 'string' ? databaseUrl.trim() : undefined;

  if (normalizedUrl) {
    return {
      type: 'postgres',
      url: normalizedUrl,
      autoLoadEntities: true,
      migrations: MIGRATIONS,
      migrationsRun: false,
      synchronize: false,
    };
  }

  const connection = databaseConnectionFactory();

  if (!connection.username) {
    throw new Error(
      'DB_USER is required when DATABASE_URL is not provided. Please supply the credential or set DATABASE_URL.',
    );
  }

  if (!connection.database) {
    throw new Error(
      'DB_NAME is required when DATABASE_URL is not provided. Please supply the database name or set DATABASE_URL.',
    );
  }

  return {
    type: 'postgres',
    host: connection.host,
    port: connection.port,
    username: connection.username,
    password: connection.password,
    database: connection.database,
    ssl: connection.ssl ? { rejectUnauthorized: false } : false,
    autoLoadEntities: true,
    migrations: MIGRATIONS,
    migrationsRun: false,
    synchronize: false,
    extra: {
      min: connection.pool.min,
      max: connection.pool.max,
      connectionTimeoutMillis: connection.pool.connectionTimeoutMillis,
      idleTimeoutMillis: connection.pool.idleTimeoutMillis,
    },
  };
}

export function buildDataSourceOptionsFromEnv(): DataSourceOptions {
  const config = databaseConnectionFactory();
  const normalizedUrl = process.env.DATABASE_URL?.trim();

  if (normalizedUrl) {
    return {
      type: 'postgres',
      url: normalizedUrl,
      entities: [User],
      migrations: MIGRATIONS,
      migrationsRun: false,
    } as DataSourceOptions;
  }

  if (!config.username) {
    throw new Error(
      'DB_USER is required when DATABASE_URL is not provided. Please supply the credential or set DATABASE_URL.',
    );
  }

  if (!config.database) {
    throw new Error(
      'DB_NAME is required when DATABASE_URL is not provided. Please supply the database name or set DATABASE_URL.',
    );
  }

  return {
    type: 'postgres',
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password,
    database: config.database,
    ssl: config.ssl ? { rejectUnauthorized: false } : false,
    entities: [User],
    migrations: MIGRATIONS,
    migrationsRun: false,
    extra: {
      min: config.pool.min,
      max: config.pool.max,
      connectionTimeoutMillis: config.pool.connectionTimeoutMillis,
      idleTimeoutMillis: config.pool.idleTimeoutMillis,
    },
  } as DataSourceOptions;
}

export function createDataSource(): DataSource {
  return new DataSource(buildDataSourceOptionsFromEnv());
}
