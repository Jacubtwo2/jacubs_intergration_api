import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Match } from '../../common/decorators/match.decorator';

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export class SignupDto {
  @ApiProperty({
    description: 'Given name of the user to create the account for.',
    example: 'Ada',
    maxLength: 120,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  firstName!: string;

  @ApiProperty({
    description: 'Family name of the user to create the account for.',
    example: 'Lovelace',
    maxLength: 120,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  lastName!: string;

  @ApiProperty({
    description: 'Unique email address that will be used for login.',
    example: 'ada.lovelace@example.com',
    maxLength: 254,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({
    description:
      'Secure password that must be at least 8 characters long and contain both letters and numbers.',
    example: 'SecureP4ssword',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @Matches(PASSWORD_REGEX, {
    message: 'Password must be at least 8 characters long and include letters and numbers.',
  })
  password!: string;

  @ApiProperty({
    description: 'Repeat of the password to confirm the intended value.',
    example: 'SecureP4ssword',
  })
  @Match('password', { message: 'Confirm password must match password.' })
  confirmPassword!: string;

  @ApiPropertyOptional({
    description: 'Contact phone number for the user.',
    example: '+15555550123',
    maxLength: 32,
  })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @ApiPropertyOptional({
    description: 'Short biography or role description displayed on the profile.',
    example: 'Engineering lead focused on automation.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;
}
