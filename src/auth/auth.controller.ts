import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { SignupDto } from './dto/signup.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RateLimitGuard } from '../common/guards/rate-limit.guard';
import {
  AccessTokenResponseDto,
  AuthSessionResponseDto,
} from './dto/auth-responses.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOperation({
    summary: 'Create a new Jacubs account',
    description:
      'Registers a new user and returns an authenticated session with access credentials.',
  })
  @ApiCreatedResponse({
    description: 'Account created successfully.',
    type: AuthSessionResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Provided details failed validation.' })
  @ApiConflictResponse({
    description: 'An account with this email already exists.',
  })
  async signup(
    @Body() dto: SignupDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.signup(dto);
    this.setRefreshCookie(res, result.refreshToken);

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Post('login')
  @ApiOperation({
    summary: 'Sign in with email and password',
    description:
      'Authenticates an existing user, issuing an access token and refresh cookie.',
  })
  @UseGuards(RateLimitGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: 'Signed in successfully.',
    type: AuthSessionResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password.' })
  @ApiTooManyRequestsResponse({
    description:
      'Too many failed sign-in attempts from this source. Please try again later.',
  })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    this.setRefreshCookie(res, result.refreshToken);

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh the access token',
    description:
      'Uses the refresh token cookie to mint a new short-lived access token.',
  })
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('refresh_token')
  @ApiOkResponse({
    description: 'Access token refreshed successfully.',
    type: AccessTokenResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Refresh token is missing or invalid.',
  })
  async refreshTokens(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const payload = req.user as { sub: string; refreshToken: string };
    const tokens = await this.authService.refreshTokens(
      payload.sub,
      payload.refreshToken,
    );
    this.setRefreshCookie(res, tokens.refreshToken);

    return { accessToken: tokens.accessToken };
  }

  @Post('logout')
  @ApiOperation({
    summary: 'Sign out and invalidate refresh token',
    description:
      'Clears the refresh cookie and revokes the existing refresh token for the authenticated user.',
  })
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  @ApiNoContentResponse({ description: 'Signed out successfully.' })
  @ApiUnauthorizedResponse({
    description: 'Access token is missing or invalid.',
  })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const user = req.user as { id?: string; sub?: string };
    const userId = user?.['id'] ?? user?.['sub'];

    if (userId) {
      await this.authService.logout(userId);
    }

    this.clearRefreshCookie(res);
  }

  private setRefreshCookie(res: Response, refreshToken: string) {
    const options = this.authService.getRefreshCookieOptions();
    res.cookie('refresh_token', refreshToken, options);
  }

  private clearRefreshCookie(res: Response) {
    const options = this.authService.getRefreshCookieOptions();
    res.clearCookie('refresh_token', options);
  }
}
