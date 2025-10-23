import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { hashPassword } from '../common/utils/password.util';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  const configService = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_ACCESS_SECRET') {
        return 'access-secret';
      }

      if (key === 'JWT_REFRESH_SECRET') {
        return 'refresh-secret';
      }

      if (key === 'NODE_ENV') {
        return 'test';
      }

      return undefined;
    }),
  } as unknown as ConfigService;

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      createUser: jest.fn(),
      setRefreshTokenHash: jest.fn(),
      findById: jest.fn(),
      toSafeUser: jest.fn((user) => ({ ...user, passwordHash: undefined, refreshTokenHash: undefined })),
    } as unknown as jest.Mocked<UsersService>;

    jwtService = {
      signAsync: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    authService = moduleRef.get(AuthService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('registers a new user and returns tokens', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    usersService.createUser.mockImplementation(async (input) => ({
      id: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      refreshTokenHash: null,
      ...input,
    }));
    jwtService.signAsync.mockResolvedValueOnce('access-token').mockResolvedValueOnce('refresh-token');

    const dto = {
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      password: 'Secure123',
      confirmPassword: 'Secure123',
    } as SignupDto;

    const result = await authService.signup(dto);

    expect(usersService.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        passwordHash: expect.not.stringContaining(dto.password),
      }),
    );
    expect(usersService.setRefreshTokenHash).toHaveBeenCalledWith(
      'user-1',
      expect.not.stringContaining('refresh-token'),
    );
    expect(result.accessToken).toEqual('access-token');
    expect(result.user.email).toEqual('ada@example.com');
  });

  it('rejects duplicate emails on signup', async () => {
    usersService.findByEmail.mockResolvedValue({ id: 'existing' } as any);

    await expect(
      authService.signup({
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        password: 'Secure123',
        confirmPassword: 'Secure123',
      } as SignupDto),
    ).rejects.toThrow('An account with this email already exists.');
  });

  it('validates credentials on login', async () => {
    const passwordHash = await hashPassword('Secure123', 12);
    usersService.findByEmail.mockResolvedValue({
      id: 'user-1',
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      passwordHash,
      refreshTokenHash: null,
    } as any);
    jwtService.signAsync.mockResolvedValueOnce('new-access').mockResolvedValueOnce('new-refresh');

    const dto = { email: 'ada@example.com', password: 'Secure123' } as LoginDto;
    const result = await authService.login(dto);

    expect(result.accessToken).toEqual('new-access');
    expect(usersService.setRefreshTokenHash).toHaveBeenCalledWith(
      'user-1',
      expect.not.stringContaining('new-refresh'),
    );
  });

  it('rotates refresh tokens', async () => {
    const refreshHash = await hashPassword('old-refresh', 12);
    usersService.findById.mockResolvedValue({
      id: 'user-1',
      email: 'ada@example.com',
      refreshTokenHash: refreshHash,
      passwordHash: 'hash',
    } as any);
    jwtService.signAsync.mockResolvedValueOnce('access-2').mockResolvedValueOnce('refresh-2');

    const tokens = await authService.refreshTokens('user-1', 'old-refresh');

    expect(tokens.accessToken).toEqual('access-2');
    expect(usersService.setRefreshTokenHash).toHaveBeenCalledWith(
      'user-1',
      expect.not.stringContaining('refresh-2'),
    );
  });

  it('clears refresh token on logout', async () => {
    await authService.logout('user-1');
    expect(usersService.setRefreshTokenHash).toHaveBeenCalledWith('user-1', null);
  });
});
