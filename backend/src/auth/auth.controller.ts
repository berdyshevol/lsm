import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiTags,
  ApiCookieAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService, AuthUser, TOKEN_TTL_SECONDS } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  private getCookieOptions() {
    return {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: this.configService.get('NODE_ENV') === 'production',
      path: '/',
      maxAge: TOKEN_TTL_SECONDS * 1000,
    };
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User registered and logged in (cookie set)',
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.register(registerDto);
    const token = this.authService.signToken(user);
    res.cookie('access_token', token, this.getCookieOptions());
    return user;
  }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @ApiOperation({
    summary: 'Login with email and password (sets httpOnly cookie)',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Logged in, access_token cookie set',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const user = req.user as AuthUser;
    const token = this.authService.signToken(user);
    res.cookie('access_token', token, this.getCookieOptions());
    return user;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Get authenticated user profile' })
  @ApiResponse({ status: 200, description: 'Authenticated user data' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  me(@Req() req: Request) {
    return req.user;
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout (clears access_token cookie)' })
  @ApiResponse({ status: 201, description: 'Logged out' })
  logout(@Res({ passthrough: true }) res: Response) {
    res.cookie('access_token', '', {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: this.configService.get('NODE_ENV') === 'production',
      path: '/',
      maxAge: 0,
    });
    return { message: 'Logged out' };
  }
}
