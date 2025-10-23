import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

export type SafeUser = Omit<User, 'passwordHash' | 'refreshTokenHash'>;

export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  phone?: string;
  bio?: string;
  profileImageUrl?: string;
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  bio?: string | null;
  profileImageUrl?: string | null;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async createUser(input: CreateUserInput): Promise<User> {
    const user = this.usersRepository.create({
      ...input,
      email: input.email.trim().toLowerCase(),
      phone: input.phone ?? null,
      bio: input.bio ?? null,
      profileImageUrl: input.profileImageUrl ?? null,
    });
    return this.usersRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    if (!email) {
      return null;
    }

    return this.usersRepository.findOne({
      where: { email: email.trim().toLowerCase() },
    });
  }

  async findById(id: string): Promise<User | null> {
    if (!id) {
      return null;
    }

    return this.usersRepository.findOne({ where: { id } });
  }

  async updateUser(id: string, updates: UpdateUserInput): Promise<User> {
    const existing = await this.findById(id);

    if (!existing) {
      throw new NotFoundException('User not found');
    }

    if (updates.firstName !== undefined) {
      existing.firstName = updates.firstName;
    }

    if (updates.lastName !== undefined) {
      existing.lastName = updates.lastName;
    }

    if (updates.phone !== undefined) {
      existing.phone = updates.phone ?? null;
    }

    if (updates.bio !== undefined) {
      existing.bio = updates.bio ?? null;
    }

    if (updates.profileImageUrl !== undefined) {
      existing.profileImageUrl = updates.profileImageUrl ?? null;
    }

    return this.usersRepository.save(existing);
  }

  async setRefreshTokenHash(userId: string, refreshTokenHash: string | null): Promise<void> {
    await this.usersRepository.update({ id: userId }, { refreshTokenHash });
  }

  toSafeUser(user: User | SafeUser): SafeUser {
    const { passwordHash: _password, refreshTokenHash: _refresh, ...safe } =
      user as User;
    return safe;
  }
}
