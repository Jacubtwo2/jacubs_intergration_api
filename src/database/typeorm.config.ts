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

  if (databaseUrl) {
    return {
      type: 'postgres',
      url: databaseUrl,
      autoLoadEntities: true,
      migrations: MIGRATIONS,
      migrationsRun: false,
      synchronize: false,
    };
  }

  const connection = databaseConnectionFactory();

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
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    return {
      type: 'postgres',
      url: databaseUrl,
      entities: [User],
      migrations: MIGRATIONS,
      migrationsRun: false,
    } as DataSourceOptions;
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
