import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminsService } from './admins.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('admins')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminsController {
  constructor(private adminsService: AdminsService) {}

  @Get('profile')
  @Roles('admin')
  async getProfile(@CurrentUser() user: any) {
    return this.adminsService.findById(user.userId);
  }
}
