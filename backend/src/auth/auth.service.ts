import { Injectable, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../users/user.entity';
import { RegisterDto } from './dto/register.dto';

export const TOKEN_TTL_SECONDS = 86400;

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

function toAuthUser(user: Omit<User, 'password'>): AuthUser {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<AuthUser | null> {
    const user = await this.usersService.findByEmailWithPassword(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      return toAuthUser(user);
    }
    return null;
  }

  signToken(user: AuthUser): string {
    const payload = {
      sub: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }

  async register(dto: RegisterDto): Promise<AuthUser> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already exists');
    }
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    let user: User;
    try {
      user = await this.usersService.create({
        ...dto,
        password: hashedPassword,
      });
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code: string }).code === '23505'
      ) {
        throw new ConflictException('Email already exists');
      }
      throw err;
    }
    return toAuthUser(user);
  }
}
