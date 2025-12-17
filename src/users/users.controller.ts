import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: any) {
    return this.usersService.findById(user.userId);
  }

  @Post('follow/:userId')
  async followUser(@CurrentUser() user: any, @Param('userId') targetUserId: string) {
    return this.usersService.followUser(user.userId, targetUserId);
  }

  @Post('unfollow/:userId')
  async unfollowUser(@CurrentUser() user: any, @Param('userId') targetUserId: string) {
    return this.usersService.unfollowUser(user.userId, targetUserId);
  }

  @Get('followers')
  async getFollowers(@CurrentUser() user: any) {
    return this.usersService.getFollowers(user.userId);
  }

  @Get('following')
  async getFollowing(@CurrentUser() user: any) {
    return this.usersService.getFollowing(user.userId);
  }

  @Get(':userId/followers')
  async getUserFollowers(@Param('userId') userId: string) {
    return this.usersService.getFollowers(userId);
  }

  @Get(':userId/following')
  async getUserFollowing(@Param('userId') userId: string) {
    return this.usersService.getFollowing(userId);
  }
}
