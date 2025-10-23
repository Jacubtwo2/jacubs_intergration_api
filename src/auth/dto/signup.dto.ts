import { Transform } from 'class-transformer';
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
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  lastName!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(8)
  @Matches(PASSWORD_REGEX, {
    message: 'Password must be at least 8 characters long and include letters and numbers.',
  })
  password!: string;

  @Match('password', { message: 'Confirm password must match password.' })
  confirmPassword!: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;
}
