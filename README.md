# NestJS Social Media Backend with Neo4j

A social media backend built with NestJS and Neo4j graph database, featuring JWT authentication, role-based access control, and leveraging graph relationships for social features.

## Features

- 🔐 **JWT Authentication** - Secure token-based authentication
- 👥 **Role-Based Access Control** - Separate Admin and User roles with different permissions
- 📊 **Neo4j Graph Database** - Leveraging graph relationships for social features
- 🔗 **Social Media Features**:
  - Follow/Unfollow users
  - Create posts
  - Like/Unlike posts
  - Get personalized feed from followed users
  - View followers and following lists

## Tech Stack

- **Framework**: NestJS
- **Database**: Neo4j (Graph Database)
- **Authentication**: JWT (JSON Web Tokens)
- **Language**: TypeScript
- **Validation**: class-validator, class-transformer

## Prerequisites

- Node.js (v16 or higher)
- Neo4j Database (v4.x or v5.x)

## Installation

1. Clone the repository
```bash
git clone <repository-url>
cd nosql-backend
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables

Create a `.env` file in the root directory:
```env
# Application
PORT=3000
NODE_ENV=development

# Neo4j Database
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-password

# JWT Authentication
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRATION=1d
```

4. Start Neo4j Database

Make sure your Neo4j database is running. You can use:
- Neo4j Desktop
- Neo4j Docker container: `docker run -p 7474:7474 -p 7687:7687 -e NEO4J_AUTH=neo4j/changeme neo4j`
- Neo4j AuraDB (cloud)
- Or use the included docker-compose: `docker-compose up -d neo4j`

## Running the Application

Development mode with hot reload:
```bash
npm run start:dev
```

Production mode:
```bash
npm run build
npm run start:prod
```

## API Endpoints

### Authentication

#### Register User
```http
POST /auth/register/user
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Register Admin
```http
POST /auth/register/admin
Content-Type: application/json

{
  "username": "admin",
  "email": "admin@example.com",
  "password": "adminpass123"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "password123"
}
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### Users (Requires Authentication)

All user endpoints require the `Authorization: Bearer <token>` header.

#### Get Current User Profile
```http
GET /users/profile
Authorization: Bearer <token>
```

#### Follow a User
```http
POST /users/follow/:userId
Authorization: Bearer <token>
```

#### Unfollow a User
```http
POST /users/unfollow/:userId
Authorization: Bearer <token>
```

#### Get My Followers
```http
GET /users/followers
Authorization: Bearer <token>
```

#### Get My Following
```http
GET /users/following
Authorization: Bearer <token>
```

#### Get User's Followers
```http
GET /users/:userId/followers
Authorization: Bearer <token>
```

#### Get User's Following
```http
GET /users/:userId/following
Authorization: Bearer <token>
```

### Posts (Requires Authentication, User Role)

#### Create Post
```http
POST /posts
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "This is my first post!"
}
```

#### Like a Post
```http
POST /posts/:postId/like
Authorization: Bearer <token>
```

#### Unlike a Post
```http
POST /posts/:postId/unlike
Authorization: Bearer <token>
```

#### Get Feed (Posts from followed users)
```http
GET /posts/feed
Authorization: Bearer <token>
```

#### Get User's Posts
```http
GET /posts/user/:userId
Authorization: Bearer <token>
```

#### Get Single Post
```http
GET /posts/:postId
Authorization: Bearer <token>
```

### Admins (Requires Authentication, Admin Role)

#### Get Admin Profile
```http
GET /admins/profile
Authorization: Bearer <token>
```

## Database Schema (Neo4j)

### Node Types

1. **User** - Regular user accounts
   - Properties: `id`, `username`, `email`, `password`, `createdAt`

2. **Admin** - Administrator accounts
   - Properties: `id`, `username`, `email`, `password`, `createdAt`

3. **Post** - User posts
   - Properties: `id`, `content`, `createdAt`

### Relationships

- `(User)-[:FOLLOWS]->(User)` - User follows another user
- `(User)-[:POSTED]->(Post)` - User created a post
- `(User)-[:LIKES]->(Post)` - User likes a post

## Graph Database Benefits

This application leverages Neo4j's graph database to provide efficient:

1. **Social Network Queries** - Finding followers, following, and connections
2. **Feed Generation** - Quickly retrieve posts from users you follow
3. **Relationship Traversal** - Efficient queries for friend-of-friend relationships
4. **Scalable Social Features** - Graph databases excel at relationship-heavy data

## Security Features

- Passwords are hashed using bcrypt
- JWT tokens for stateless authentication
- Role-based access control (RBAC)
- Input validation using class-validator
- Separate User and Admin tables/nodes

## Project Structure

```
src/
├── admins/           # Admin module
│   ├── admins.controller.ts
│   ├── admins.service.ts
│   ├── admins.module.ts
│   ├── admin.entity.ts
│   └── dto/
├── auth/             # Authentication module
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.module.ts
│   └── jwt.strategy.ts
├── common/           # Shared resources
│   ├── decorators/
│   └── guards/
├── config/           # Configuration
├── database/         # Database module
│   └── database.module.ts
├── posts/            # Posts module
│   ├── posts.controller.ts
│   ├── posts.service.ts
│   ├── posts.module.ts
│   ├── post.entity.ts
│   └── dto/
├── users/            # Users module
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── users.module.ts
│   ├── user.entity.ts
│   └── dto/
├── app.module.ts     # Root module
└── main.ts           # Application entry point
```

## License

ISC