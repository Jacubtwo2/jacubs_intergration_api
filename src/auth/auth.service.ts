import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { UsersService, SafeUser } from '../users/users.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { hashPassword, verifyPassword } from '../common/utils/password.util';

const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes
const HASH_ROUNDS = 12;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthenticatedUser {
  accessToken: string;
  user: SafeUser;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signup(dto: SignupDto): Promise<AuthenticatedUser> {
    const existing = await this.usersService.findByEmail(dto.email);

    if (existing) {
      throw new ConflictException('An account with this email already exists.');
    }

    const passwordHash = await hashPassword(dto.password, HASH_ROUNDS);
    const user = await this.usersService.createUser({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      passwordHash,
      phone: dto.phone,
      bio: dto.bio,
    });

    const tokens = await this.generateTokens(user.id, user.email);
    await this.setRefreshToken(user.id, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.usersService.toSafeUser(user),
    };
  }

  async login(dto: LoginDto): Promise<AuthenticatedUser> {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const passwordValid = await verifyPassword(dto.password, user.passwordHash);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const tokens = await this.generateTokens(user.id, user.email);
    await this.setRefreshToken(user.id, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.usersService.toSafeUser(user),
    };
  }

  async refreshTokens(userId: string, refreshToken: string): Promise<AuthTokens> {
    const user = await this.usersService.findById(userId);

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Refresh token is invalid.');
    }

    const tokenMatches = await verifyPassword(refreshToken, user.refreshTokenHash);

    if (!tokenMatches) {
      throw new UnauthorizedException('Refresh token is invalid.');
    }

    const tokens = await this.generateTokens(user.id, user.email);
    await this.setRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.setRefreshTokenHash(userId, null);
  }

  getRefreshCookieOptions() {
    const secureEnv = this.configService.get<string>('REFRESH_COOKIE_SECURE');
    const secure =
      secureEnv !== undefined
        ? secureEnv === 'true' || secureEnv === '1'
        : this.configService.get<string>('NODE_ENV') === 'production';

    const domain = this.configService.get<string>('REFRESH_COOKIE_DOMAIN');

    return {
      httpOnly: true,
      secure,
      sameSite: 'lax' as const,
      path: '/auth',
      maxAge: REFRESH_TOKEN_TTL_SECONDS * 1000,
      domain: domain ?? undefined,
    };
  }

  private async generateTokens(userId: string, email: string): Promise<AuthTokens> {
    const tokenId = randomUUID();
    const accessToken = await this.jwtService.signAsync(
      {
        sub: userId,
        email,
      },
      {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: `${ACCESS_TOKEN_TTL_SECONDS}s`,
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      {
        sub: userId,
        email,
        tokenId,
      },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: `${REFRESH_TOKEN_TTL_SECONDS}s`,
      },
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  private async setRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const hashedToken = await hashPassword(refreshToken, HASH_ROUNDS);
    await this.usersService.setRefreshTokenHash(userId, hashedToken);
  }
}
