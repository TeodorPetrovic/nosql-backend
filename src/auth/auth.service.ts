import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { AdminsService } from '../admins/admins.service';
import { LoginDto } from '../users/dto/user.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private adminsService: AdminsService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    // Try to find user first
    const user = await this.usersService.findByUsername(username);
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return { ...result, role: 'user' };
    }

    // Try to find admin
    const admin = await this.adminsService.findByUsername(username);
    if (admin && await bcrypt.compare(password, admin.password)) {
      const { password, ...result } = admin;
      return { ...result, role: 'admin' };
    }

    return null;
  }

  async login(loginDto: LoginDto) {
    const account = await this.validateUser(loginDto.username, loginDto.password);
    
    if (!account) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { 
      username: account.username, 
      sub: account.id,
      role: account.role 
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: account.id,
        username: account.username,
        email: account.email,
        role: account.role,
      }
    };
  }
}
