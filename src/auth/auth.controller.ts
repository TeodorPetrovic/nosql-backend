import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { AdminsService } from '../admins/admins.service';
import { CreateUserDto, LoginDto } from '../users/dto/user.dto';
import { CreateAdminDto } from '../admins/dto/admin.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private adminsService: AdminsService,
  ) {}

  @Post('register/user')
  async registerUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Post('register/admin')
  async registerAdmin(@Body() createAdminDto: CreateAdminDto) {
    return this.adminsService.create(createAdminDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
