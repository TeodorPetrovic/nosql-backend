import { Injectable, Inject, ConflictException, NotFoundException } from '@nestjs/common';
import { Driver } from 'neo4j-driver';
import * as bcrypt from 'bcrypt';
import { NEO4J_DRIVER } from '../database/database.module';
import { User } from './user.entity';
import { CreateUserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    @Inject(NEO4J_DRIVER) private readonly driver: Driver,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const session = this.driver.session();
    try {
      // Check if user already exists
      const existingUser = await session.run(
        'MATCH (u:User {username: $username}) RETURN u',
        { username: createUserDto.username }
      );

      if (existingUser.records.length > 0) {
        throw new ConflictException('Username already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

      // Create user
      const result = await session.run(
        `CREATE (u:User {
          id: randomUUID(),
          username: $username,
          email: $email,
          password: $password,
          createdAt: datetime()
        })
        RETURN u`,
        {
          username: createUserDto.username,
          email: createUserDto.email,
          password: hashedPassword,
        }
      );

      const userNode = result.records[0].get('u').properties;
      const { password, ...userWithoutPassword } = userNode;
      return userWithoutPassword;
    } finally {
      await session.close();
    }
  }

  async findByUsername(username: string): Promise<User | null> {
    const session = this.driver.session();
    try {
      const result = await session.run(
        'MATCH (u:User {username: $username}) RETURN u',
        { username }
      );

      if (result.records.length === 0) {
        return null;
      }

      return result.records[0].get('u').properties as User;
    } finally {
      await session.close();
    }
  }

  async findById(id: string): Promise<Omit<User, 'password'> | null> {
    const session = this.driver.session();
    try {
      const result = await session.run(
        'MATCH (u:User {id: $id}) RETURN u',
        { id }
      );

      if (result.records.length === 0) {
        return null;
      }

      const userNode = result.records[0].get('u').properties;
      const { password, ...userWithoutPassword } = userNode;
      return userWithoutPassword;
    } finally {
      await session.close();
    }
  }

  async followUser(userId: string, targetUserId: string): Promise<{ message: string }> {
    if (userId === targetUserId) {
      throw new ConflictException('Cannot follow yourself');
    }

    const session = this.driver.session();
    try {
      // Check if both users exist
      const usersExist = await session.run(
        `MATCH (u1:User {id: $userId})
         MATCH (u2:User {id: $targetUserId})
         RETURN u1, u2`,
        { userId, targetUserId }
      );

      if (usersExist.records.length === 0) {
        throw new NotFoundException('One or both users not found');
      }

      // Create FOLLOWS relationship
      await session.run(
        `MATCH (u1:User {id: $userId})
         MATCH (u2:User {id: $targetUserId})
         MERGE (u1)-[r:FOLLOWS]->(u2)
         RETURN r`,
        { userId, targetUserId }
      );

      return { message: 'Successfully followed user' };
    } finally {
      await session.close();
    }
  }

  async unfollowUser(userId: string, targetUserId: string): Promise<{ message: string }> {
    const session = this.driver.session();
    try {
      await session.run(
        `MATCH (u1:User {id: $userId})-[r:FOLLOWS]->(u2:User {id: $targetUserId})
         DELETE r`,
        { userId, targetUserId }
      );

      return { message: 'Successfully unfollowed user' };
    } finally {
      await session.close();
    }
  }

  async getFollowers(userId: string): Promise<any[]> {
    const session = this.driver.session();
    try {
      const result = await session.run(
        `MATCH (follower:User)-[:FOLLOWS]->(u:User {id: $userId})
         RETURN follower.id as id, follower.username as username, follower.email as email`,
        { userId }
      );

      return result.records.map(record => ({
        id: record.get('id'),
        username: record.get('username'),
        email: record.get('email'),
      }));
    } finally {
      await session.close();
    }
  }

  async getFollowing(userId: string): Promise<any[]> {
    const session = this.driver.session();
    try {
      const result = await session.run(
        `MATCH (u:User {id: $userId})-[:FOLLOWS]->(following:User)
         RETURN following.id as id, following.username as username, following.email as email`,
        { userId }
      );

      return result.records.map(record => ({
        id: record.get('id'),
        username: record.get('username'),
        email: record.get('email'),
      }));
    } finally {
      await session.close();
    }
  }
}
