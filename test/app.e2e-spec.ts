import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import request from 'supertest';
import { join } from 'path';
import { AppModule } from '../src/app.module';
import { resolveApiVersion } from '../src/config/api-version.util';

describe('Authentication flow (e2e)', () => {
  let app: INestApplication;
  let apiPrefix: string;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    process.env.API_VERSION = 'api/v1';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    apiPrefix = resolveApiVersion();

    app.setGlobalPrefix(apiPrefix);
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.use(helmet());
    app.use(cookieParser());
    app.enableCors({ origin: true, credentials: true });
    app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should execute the happy path authentication journey', async () => {
    const signupResponse = await request(app.getHttpServer())
      .post(`/${apiPrefix}/auth/signup`)
      .send({
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        password: 'Secure123',
        confirmPassword: 'Secure123',
      })
      .expect(201);

    const signupCookie = extractRefreshCookie(signupResponse.headers['set-cookie']);
    expect(signupCookie).toBeDefined();
    expect(signupResponse.body).toMatchObject({
      accessToken: expect.any(String),
      user: expect.objectContaining({
        email: 'ada@example.com',
        firstName: 'Ada',
        lastName: 'Lovelace',
      }),
    });

    const loginResponse = await request(app.getHttpServer())
      .post(`/${apiPrefix}/auth/login`)
      .send({ email: 'ada@example.com', password: 'Secure123' })
      .expect(200);

    const loginCookie = extractRefreshCookie(loginResponse.headers['set-cookie']);
    expect(loginCookie).toBeDefined();
    const accessToken = loginResponse.body.accessToken as string;
    expect(accessToken).toBeDefined();

    // Attempting to reuse the signup cookie should now fail
    await request(app.getHttpServer())
      .post(`/${apiPrefix}/auth/refresh`)
      .set('Cookie', signupCookie ? [signupCookie] : [])
      .expect(401);

    const meResponse = await request(app.getHttpServer())
      .get(`/${apiPrefix}/users/me`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(meResponse.body).toMatchObject({
      email: 'ada@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
      phone: null,
      bio: null,
    });

    const refreshResponse = await request(app.getHttpServer())
      .post(`/${apiPrefix}/auth/refresh`)
      .set('Cookie', loginCookie ? [loginCookie] : [])
      .expect(200);

    const refreshedCookie = extractRefreshCookie(refreshResponse.headers['set-cookie']);
    expect(refreshedCookie).toBeDefined();
    const refreshedAccessToken = refreshResponse.body.accessToken as string;
    expect(refreshedAccessToken).toBeDefined();

    // Old refresh token should be invalid after rotation
    await request(app.getHttpServer())
      .post(`/${apiPrefix}/auth/refresh`)
      .set('Cookie', loginCookie ? [loginCookie] : [])
      .expect(401);

    await request(app.getHttpServer())
      .post(`/${apiPrefix}/auth/logout`)
      .set('Authorization', `Bearer ${refreshedAccessToken}`)
      .expect(204);

    // Ensure refresh token cleared
    await request(app.getHttpServer())
      .post(`/${apiPrefix}/auth/refresh`)
      .set('Cookie', refreshedCookie ? [refreshedCookie] : [])
      .expect(401);
  });
});

function extractRefreshCookie(cookies?: string[]): string | undefined {
  if (!cookies || cookies.length === 0) {
    return undefined;
  }

  return cookies.find((cookie) => cookie.startsWith('refresh_token='));
}
