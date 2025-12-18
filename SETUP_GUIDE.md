# NestJS + Neo4j Social Media Backend - Setup Guide

Complete setup guide for building a social media backend with NestJS and Neo4j.

---

## Table of Contents

1. [Install Packages](#1-install-packages)
2. [Database Setup](#2-database-setup)
3. [JWT Setup](#3-jwt-setup)
4. [Auth Configuration](#4-auth-configuration)
5. [User Configuration](#5-user-configuration)
6. [Post Services](#6-post-services)
7. [Configuration Examples](#7-configuration-examples)

---

## 1. Install Packages

### Core NestJS Dependencies

```bash
npm install @nestjs/common @nestjs/core @nestjs/platform-express @nestjs/config
```

### Neo4j Database Driver

```bash
npm install neo4j-driver
```

### Authentication Packages

```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt passport-local bcrypt
```

### Validation Packages

```bash
npm install class-validator class-transformer
```

### Dev Dependencies

```bash
npm install -D @types/bcrypt @types/passport-jwt @types/passport-local @nestjs/cli typescript
```

### All-in-One Install Command

```bash
npm install @nestjs/common @nestjs/core @nestjs/platform-express @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt passport-local bcrypt class-validator class-transformer neo4j-driver reflect-metadata rxjs

npm install -D @types/bcrypt @types/passport-jwt @types/passport-local @nestjs/cli @nestjs/schematics typescript ts-node @types/node @types/express
```

---

## 2. Database Setup

### Environment Variables (`.env`)

```env
# Neo4j Database
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-password
NEO4J_DATABASE=social
```

### Database Module (`src/database/database.module.ts`)

```typescript
import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import neo4j, { Driver } from 'neo4j-driver';

export const NEO4J_DRIVER = 'NEO4J_DRIVER';
export const NEO4J_DATABASE = 'NEO4J_DATABASE';

@Global()
@Module({
  providers: [
    {
      provide: NEO4J_DRIVER,
      useFactory: async (configService: ConfigService): Promise<Driver> => {
        const uri = configService.get<string>('NEO4J_URI');
        const username = configService.get<string>('NEO4J_USERNAME');
        const password = configService.get<string>('NEO4J_PASSWORD');

        const driver = neo4j.driver(
          uri,
          neo4j.auth.basic(username, password)
        );

        // Verify connectivity
        await driver.verifyConnectivity();
        console.log('Neo4j connection established successfully');

        return driver;
      },
      inject: [ConfigService],
    },
    {
      provide: NEO4J_DATABASE,
      useFactory: (configService: ConfigService): string => {
        return configService.get<string>('NEO4J_DATABASE', 'neo4j');
      },
      inject: [ConfigService],
    }
  ],
  exports: [NEO4J_DRIVER, NEO4J_DATABASE],
})
export class DatabaseModule {}
```

### Using Database in Services

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { Driver } from 'neo4j-driver';
import { NEO4J_DRIVER, NEO4J_DATABASE } from '../database/database.module';

@Injectable()
export class ExampleService {
  constructor(
    @Inject(NEO4J_DRIVER) private readonly driver: Driver,
    @Inject(NEO4J_DATABASE) private readonly database: string,
  ) {}

  async runQuery() {
    // Target specific database
    const session = this.driver.session({ database: this.database });
    try {
      const result = await session.run('MATCH (n) RETURN n LIMIT 10');
      return result.records;
    } finally {
      await session.close();
    }
  }
}
```

---

## 3. JWT Setup

### Environment Variables

```env
# JWT Authentication
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRATION=1d
```

### JWT Strategy (`src/auth/jwt.strategy.ts`)

```typescript
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    return { 
      userId: payload.sub, 
      username: payload.username,
      role: payload.role 
    };
  }
}
```

---

## 4. Auth Configuration

### Auth Module (`src/auth/auth.module.ts`)

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '../users/users.module';
import { AdminsModule } from '../admins/admins.module';

@Module({
  imports: [
    UsersModule,
    AdminsModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => {
        const expiration = configService.get<string>('JWT_EXPIRATION') || '1d';
        return {
          secret: configService.get<string>('JWT_SECRET'),
          signOptions: { 
            expiresIn: expiration as StringValue | number
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
```

### Auth Service (`src/auth/auth.service.ts`)

```typescript
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
```

### JWT Auth Guard (`src/common/guards/jwt-auth.guard.ts`)

```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

### Roles Guard (`src/common/guards/roles.guard.ts`)

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true;
    }
    
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.role === role);
  }
}
```

### Decorators

**Roles Decorator (`src/common/decorators/roles.decorator.ts`)**:

```typescript
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```

**Current User Decorator (`src/common/decorators/current-user.decorator.ts`)**:

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

---

## 5. User Configuration

### User Entity (`src/users/user.entity.ts`)

```typescript
export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  createdAt: Date;
}
```

### User DTOs (`src/users/dto/user.dto.ts`)

```typescript
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;
}

export class LoginDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
```

### Users Module (`src/users/users.module.ts`)

```typescript
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
```

### Users Service (`src/users/users.service.ts`)

```typescript
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
```

---

## 6. Post Services

### Post Entity (`src/posts/post.entity.ts`)

```typescript
export interface Post {
  id: string;
  content: string;
  userId: string;
  createdAt: Date;
}
```

### Post DTO (`src/posts/dto/post.dto.ts`)

```typescript
import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePostDto {
  @IsNotEmpty()
  @IsString()
  content: string;
}
```

### Posts Module (`src/posts/posts.module.ts`)

```typescript
import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';

@Module({
  providers: [PostsService],
  controllers: [PostsController],
  exports: [PostsService],
})
export class PostsModule {}
```

### Posts Service (`src/posts/posts.service.ts`)

```typescript
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
```

---

## 7. Configuration Examples

### Complete `.env` File

```env
# Application
PORT=3000
NODE_ENV=development

# Neo4j Database
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=social123
NEO4J_DATABASE=social

# JWT Authentication
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRATION=1d
```

### App Module (`src/app.module.ts`)

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AdminsModule } from './admins/admins.module';
import { PostsModule } from './posts/posts.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    AdminsModule,
    PostsModule,
  ],
})
export class AppModule {}
```

### Main Entry Point (`src/main.ts`)

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable validation globally
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));
  
  // Enable CORS
  app.enableCors();
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
```

### Docker Compose (`docker-compose.yml`)

```yaml
version: '3.8'

services:
  neo4j:
    image: neo4j:5-community
    container_name: neo4j-social
    ports:
      - "7474:7474"  # HTTP
      - "7687:7687"  # Bolt
    environment:
      - NEO4J_AUTH=neo4j/social123
      - NEO4J_PLUGINS=["apoc"]
    volumes:
      - neo4j_data:/data
      - neo4j_logs:/logs

volumes:
  neo4j_data:
  neo4j_logs:
```

### Run Commands

```bash
# Start Neo4j with Docker
docker-compose up -d

# Install dependencies
npm install

# Run in development mode
npm run start:dev

# Build for production
npm run build

# Run in production mode
npm run start:prod
```

---

## Quick Reference - Neo4j Cypher Queries

### Create User
```cypher
CREATE (u:User {id: randomUUID(), username: 'john', email: 'john@example.com', password: 'hashed', createdAt: datetime()})
```

### Create Post
```cypher
MATCH (u:User {id: $userId})
CREATE (p:Post {id: randomUUID(), content: 'Hello World', createdAt: datetime()})
CREATE (u)-[:POSTED]->(p)
```

### Follow User
```cypher
MATCH (u1:User {id: $userId}), (u2:User {id: $targetUserId})
MERGE (u1)-[:FOLLOWS]->(u2)
```

### Like Post
```cypher
MATCH (u:User {id: $userId}), (p:Post {id: $postId})
MERGE (u)-[:LIKES]->(p)
```

### Get Feed
```cypher
MATCH (u:User {id: $userId})-[:FOLLOWS]->(followed)-[:POSTED]->(p:Post)
RETURN p ORDER BY p.createdAt DESC LIMIT 50
```
