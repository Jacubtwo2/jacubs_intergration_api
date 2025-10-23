export interface DatabasePoolConfig {
  readonly min: number;
  readonly max: number;
  readonly idleTimeoutMillis: number;
  readonly connectionTimeoutMillis: number;
}

export interface DatabaseConnectionConfig {
  readonly type: string;
  readonly host: string;
  readonly port: number;
  readonly username?: string;
  readonly password?: string;
  readonly database?: string;
  readonly ssl: boolean;
  readonly pool: DatabasePoolConfig;
}
