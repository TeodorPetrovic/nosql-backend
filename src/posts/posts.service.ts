import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Driver } from 'neo4j-driver';
import { NEO4J_DRIVER } from '../database/database.module';
import { CreatePostDto } from './dto/post.dto';

@Injectable()
export class PostsService {
  constructor(
    @Inject(NEO4J_DRIVER) private readonly driver: Driver,
  ) {}

  async createPost(userId: string, createPostDto: CreatePostDto): Promise<any> {
    const session = this.driver.session();
    try {
      const result = await session.run(
        `MATCH (u:User {id: $userId})
         CREATE (p:Post {
           id: randomUUID(),
           content: $content,
           createdAt: datetime()
         })
         CREATE (u)-[:POSTED]->(p)
         RETURN p, u.username as username`,
        {
          userId,
          content: createPostDto.content,
        }
      );

      if (result.records.length === 0) {
        throw new NotFoundException('User not found');
      }

      const post = result.records[0].get('p').properties;
      const username = result.records[0].get('username');
      
      return {
        ...post,
        username,
      };
    } finally {
      await session.close();
    }
  }

  async likePost(userId: string, postId: string): Promise<{ message: string }> {
    const session = this.driver.session();
    try {
      const result = await session.run(
        `MATCH (u:User {id: $userId})
         MATCH (p:Post {id: $postId})
         MERGE (u)-[r:LIKES]->(p)
         RETURN r`,
        { userId, postId }
      );

      if (result.records.length === 0) {
        throw new NotFoundException('User or Post not found');
      }

      return { message: 'Post liked successfully' };
    } finally {
      await session.close();
    }
  }

  async unlikePost(userId: string, postId: string): Promise<{ message: string }> {
    const session = this.driver.session();
    try {
      await session.run(
        `MATCH (u:User {id: $userId})-[r:LIKES]->(p:Post {id: $postId})
         DELETE r`,
        { userId, postId }
      );

      return { message: 'Post unliked successfully' };
    } finally {
      await session.close();
    }
  }

  async getUserPosts(userId: string): Promise<any[]> {
    const session = this.driver.session();
    try {
      const result = await session.run(
        `MATCH (u:User {id: $userId})-[:POSTED]->(p:Post)
         OPTIONAL MATCH (p)<-[:LIKES]-(liker:User)
         WITH p, u.username as username, count(liker) as likesCount
         RETURN p, username, likesCount
         ORDER BY p.createdAt DESC`,
        { userId }
      );

      return result.records.map(record => ({
        ...record.get('p').properties,
        username: record.get('username'),
        likesCount: record.get('likesCount').toNumber(),
      }));
    } finally {
      await session.close();
    }
  }

  async getFeed(userId: string): Promise<any[]> {
    const session = this.driver.session();
    try {
      // Get posts from users that the current user follows
      const result = await session.run(
        `MATCH (u:User {id: $userId})-[:FOLLOWS]->(followed:User)-[:POSTED]->(p:Post)
         OPTIONAL MATCH (p)<-[:LIKES]-(liker:User)
         WITH p, followed.username as username, count(liker) as likesCount
         RETURN p, username, likesCount
         ORDER BY p.createdAt DESC
         LIMIT 50`,
        { userId }
      );

      return result.records.map(record => ({
        ...record.get('p').properties,
        username: record.get('username'),
        likesCount: record.get('likesCount').toNumber(),
      }));
    } finally {
      await session.close();
    }
  }

  async getPostById(postId: string): Promise<any> {
    const session = this.driver.session();
    try {
      const result = await session.run(
        `MATCH (u:User)-[:POSTED]->(p:Post {id: $postId})
         OPTIONAL MATCH (p)<-[:LIKES]-(liker:User)
         WITH p, u.username as username, count(liker) as likesCount
         RETURN p, username, likesCount`,
        { postId }
      );

      if (result.records.length === 0) {
        throw new NotFoundException('Post not found');
      }

      return {
        ...result.records[0].get('p').properties,
        username: result.records[0].get('username'),
        likesCount: result.records[0].get('likesCount').toNumber(),
      };
    } finally {
      await session.close();
    }
  }
}
