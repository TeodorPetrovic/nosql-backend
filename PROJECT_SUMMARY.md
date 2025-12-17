# Project Summary

## Overview
This is a complete NestJS backend application with Neo4j graph database integration, designed for a social media platform with robust authentication and role-based access control.

## Key Features Implemented

### 1. Authentication & Authorization
- **JWT-based Authentication**: Secure token-based auth with configurable expiration
- **Dual Role System**: Separate User and Admin roles stored as distinct node types in Neo4j
- **Password Security**: Bcrypt hashing with 10 salt rounds
- **Role-Based Guards**: Custom guards enforce permissions on endpoints
- **Decorators**: `@Roles()` and `@CurrentUser()` for clean, declarative security

### 2. Database Architecture
- **Neo4j Graph Database**: Leverages graph relationships for efficient social queries
- **Node Types**:
  - `User`: Regular user accounts with social features
  - `Admin`: Administrative accounts with elevated permissions
  - `Post`: User-generated content
- **Relationships**:
  - `FOLLOWS`: User → User (social connections)
  - `POSTED`: User → Post (content ownership)
  - `LIKES`: User → Post (engagement)

### 3. Social Media Endpoints

#### User Management (`/users`)
- `GET /users/profile` - Get current user profile
- `POST /users/follow/:userId` - Follow another user
- `POST /users/unfollow/:userId` - Unfollow a user
- `GET /users/followers` - Get my followers list
- `GET /users/following` - Get users I follow
- `GET /users/:userId/followers` - Get another user's followers
- `GET /users/:userId/following` - Get who another user follows

#### Post Management (`/posts`)
- `POST /posts` - Create a new post
- `POST /posts/:postId/like` - Like a post
- `POST /posts/:postId/unlike` - Unlike a post
- `GET /posts/feed` - Get personalized feed (posts from followed users)
- `GET /posts/user/:userId` - Get a user's posts
- `GET /posts/:postId` - Get a specific post with like count

#### Authentication (`/auth`)
- `POST /auth/register/user` - Register a new user
- `POST /auth/register/admin` - Register a new admin
- `POST /auth/login` - Login and receive JWT token

#### Admin (`/admins`)
- `GET /admins/profile` - Get admin profile (admin role required)

## Technical Stack

### Core Dependencies
- **NestJS** (v11.x): Modern TypeScript framework
- **Neo4j Driver** (v6.x): Official Neo4j database driver
- **Passport JWT**: JWT authentication strategy
- **bcrypt**: Password hashing
- **class-validator**: DTO validation
- **class-transformer**: Object transformation

### Development Tools
- **TypeScript** (v5.x): Type-safe development
- **ts-node**: TypeScript execution
- **NestJS CLI**: Project scaffolding and building

## Project Structure

```
src/
├── admins/              # Admin module
│   ├── admins.controller.ts
│   ├── admins.service.ts
│   ├── admins.module.ts
│   ├── admin.entity.ts
│   └── dto/
│       └── admin.dto.ts
├── auth/                # Authentication module
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.module.ts
│   └── jwt.strategy.ts
├── common/              # Shared utilities
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   └── roles.decorator.ts
│   └── guards/
│       ├── jwt-auth.guard.ts
│       └── roles.guard.ts
├── database/            # Database configuration
│   └── database.module.ts
├── posts/               # Posts module
│   ├── posts.controller.ts
│   ├── posts.service.ts
│   ├── posts.module.ts
│   ├── post.entity.ts
│   └── dto/
│       └── post.dto.ts
├── users/               # Users module
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── users.module.ts
│   ├── user.entity.ts
│   └── dto/
│       └── user.dto.ts
├── app.module.ts        # Root application module
└── main.ts              # Application entry point
```

## Configuration

### Environment Variables (.env)
```env
PORT=3000
NODE_ENV=development
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=changeme
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRATION=1d
```

## Docker Support

### Neo4j with Docker Compose
```bash
docker-compose up -d neo4j
```

### Full Application (Optional)
Uncomment the `app` service in `docker-compose.yml` to run the entire stack in Docker.

### Build Docker Image
```bash
docker build -t nosql-backend .
```

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Start Neo4j**
   ```bash
   docker-compose up -d neo4j
   ```

4. **Run Application**
   ```bash
   # Development
   npm run start:dev
   
   # Production
   npm run build
   npm run start:prod
   ```

5. **Set Up Neo4j Constraints** (recommended)
   - Open Neo4j Browser at http://localhost:7474
   - Run the Cypher queries from `NEO4J_QUERIES.md`

## Documentation

- **README.md**: Setup instructions and API documentation
- **TESTING.md**: Comprehensive testing guide with examples
- **NEO4J_QUERIES.md**: Useful Cypher queries for Neo4j
- **postman_collection.json**: Postman collection for API testing

## Security Features

✅ **Password Hashing**: All passwords hashed with bcrypt
✅ **JWT Tokens**: Secure, stateless authentication
✅ **Role-Based Access**: Enforced at the endpoint level
✅ **Input Validation**: All DTOs validated with class-validator
✅ **No Hardcoded Secrets**: Environment-based configuration
✅ **CORS Enabled**: Cross-origin requests supported
✅ **No SQL Injection**: Parameterized Cypher queries

## Graph Database Benefits

1. **Efficient Relationship Traversal**: Finding followers, following, and connections is a natural graph operation
2. **Scalable Social Features**: Adding features like friend-of-friend recommendations is straightforward
3. **Flexible Schema**: Easy to add new relationship types without migrations
4. **Performance**: Graph queries for social data outperform traditional relational databases
5. **Intuitive Data Model**: Relationships are first-class citizens in Neo4j

## Future Enhancement Ideas

- Profile pictures and user bios
- Post comments with threaded replies
- Post sharing/reposting
- User mentions and hashtags
- Real-time notifications
- Friend recommendations (graph algorithms)
- Content moderation (admin features)
- Direct messaging
- Post media attachments
- Search functionality

## Testing

See `TESTING.md` for detailed testing instructions including:
- Registration and login flows
- Social features (follow/unfollow)
- Post creation and engagement
- Feed generation
- Role-based access testing
- Neo4j data verification

## License

ISC
