import 'express-serve-static-core';

declare module 'express-serve-static-core' {
  interface Request {
    user?: Record<string, unknown>;
    cookies?: Record<string, string>;
  }
}

declare namespace Express {
  namespace Multer {
    interface File {
      readonly fieldname: string;
      readonly originalname: string;
      readonly encoding: string;
      readonly mimetype: string;
      readonly size: number;
      readonly destination: string;
      readonly filename: string;
      readonly path: string;
      readonly buffer: Buffer;
    }
  }
}
