import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/post.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('posts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Post()
  @Roles('user')
  async createPost(@CurrentUser() user: any, @Body() createPostDto: CreatePostDto) {
    return this.postsService.createPost(user.userId, createPostDto);
  }

  @Post(':postId/like')
  @Roles('user')
  async likePost(@CurrentUser() user: any, @Param('postId') postId: string) {
    return this.postsService.likePost(user.userId, postId);
  }

  @Post(':postId/unlike')
  @Roles('user')
  async unlikePost(@CurrentUser() user: any, @Param('postId') postId: string) {
    return this.postsService.unlikePost(user.userId, postId);
  }

  @Get('feed')
  @Roles('user')
  async getFeed(@CurrentUser() user: any) {
    return this.postsService.getFeed(user.userId);
  }

  @Get('user/:userId')
  async getUserPosts(@Param('userId') userId: string) {
    return this.postsService.getUserPosts(userId);
  }

  @Get(':postId')
  async getPost(@Param('postId') postId: string) {
    return this.postsService.getPostById(postId);
  }
}
