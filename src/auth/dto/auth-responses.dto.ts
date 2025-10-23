import { ApiProperty } from '@nestjs/swagger';

export class AuthenticatedUserProfileDto {
  @ApiProperty({ example: 'f3c1d4d2-12f4-4c2d-9b98-8ac9c47d41f8' })
  id!: string;

  @ApiProperty({ example: 'Ada' })
  firstName!: string;

  @ApiProperty({ example: 'Lovelace' })
  lastName!: string;

  @ApiProperty({ example: 'ada.lovelace@example.com' })
  email!: string;

  @ApiProperty({ example: '+15555550123', nullable: true })
  phone!: string | null;

  @ApiProperty({
    example: 'Engineering lead focused on automation.',
    nullable: true,
  })
  bio!: string | null;

  @ApiProperty({
    example: 'https://cdn.jacubs.example/profiles/f3c1d4d2.png',
    nullable: true,
  })
  profileImageUrl!: string | null;

  @ApiProperty({ example: '2024-03-01T12:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2024-03-05T08:30:00.000Z' })
  updatedAt!: Date;
}

export class AuthSessionResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken!: string;

  @ApiProperty({ type: () => AuthenticatedUserProfileDto })
  user!: AuthenticatedUserProfileDto;
}

export class AccessTokenResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken!: string;
}
