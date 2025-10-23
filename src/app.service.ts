import { Injectable } from '@nestjs/common';
import { resolveApiVersion } from './config/api-version.util';

export interface ApiStatusResponse {
  status: 'ok';
  service: string;
  message: string;
  version: string;
  docs: {
    url: string;
    description: string;
  };
  uptime: {
    seconds: number;
    humanReadable: string;
  };
  timestamp: string;
}

@Injectable()
export class AppService {
  getStatus(): ApiStatusResponse {
    const apiVersion = resolveApiVersion();
    const uptimeSeconds = Math.max(0, Math.round(process.uptime()));

    return {
      status: 'ok',
      service: 'Jacubs Integration API',
      message: 'Jacubs Integration API is online and accepting requests.',
      version: apiVersion,
      docs: {
        url: `/${apiVersion}/docs`,
        description:
          'Interactive API reference powered by Swagger UI with curated guidance inspired by API Dog.',
      },
      uptime: {
        seconds: uptimeSeconds,
        humanReadable: formatDuration(uptimeSeconds),
      },
      timestamp: new Date().toISOString(),
    };
  }
}

function formatDuration(totalSeconds: number): string {
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);

  const pad = (value: number) => value.toString().padStart(2, '0');

  return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
}
