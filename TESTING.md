# Testing Guide

This guide will help you test the NestJS Social Media Backend API.

## Prerequisites

1. **Neo4j Database Running**
   - Option 1: Use Docker Compose (Recommended)
     ```bash
     docker-compose up -d neo4j
     ```
   - Option 2: Use Neo4j Desktop
   - Option 3: Use Neo4j AuraDB (Cloud)

2. **Environment Variables Set**
   - Copy `.env.example` to `.env`
   - Update the values, especially `NEO4J_PASSWORD` and `JWT_SECRET`

## Starting the Application

Development mode with hot reload:
```bash
npm run start:dev
```

The application will start on `http://localhost:3000`

## Testing Workflow

### 1. Register Users and Admin

**Register a User:**
```bash
curl -X POST http://localhost:3000/auth/register/user \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice",
    "email": "alice@example.com",
    "password": "password123"
  }'
```

**Register Another User:**
```bash
curl -X POST http://localhost:3000/auth/register/user \
  -H "Content-Type: application/json" \
  -d '{
    "username": "bob",
    "email": "bob@example.com",
    "password": "password123"
  }'
```

**Register an Admin:**
```bash
curl -X POST http://localhost:3000/auth/register/admin \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "adminpass123"
  }'
```

### 2. Login to Get JWT Token

**Login as Alice:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice",
    "password": "password123"
  }'
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "username": "alice",
    "email": "alice@example.com",
    "role": "user"
  }
}
```

**Save the access_token** - you'll need it for subsequent requests.

### 3. Test User Endpoints

**Get Profile:**
```bash
curl -X GET http://localhost:3000/users/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Follow Bob** (you'll need Bob's user ID from registration):
```bash
curl -X POST http://localhost:3000/users/follow/BOB_USER_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Get Following List:**
```bash
curl -X GET http://localhost:3000/users/following \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Get Followers List:**
```bash
curl -X GET http://localhost:3000/users/followers \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Test Post Creation and Engagement

**Create a Post:**
```bash
curl -X POST http://localhost:3000/posts \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello world! This is my first post 🚀"
  }'
```

Response includes the post ID - save it for the next steps.

**Like a Post:**
```bash
curl -X POST http://localhost:3000/posts/POST_ID/like \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Get User's Posts:**
```bash
curl -X GET http://localhost:3000/posts/user/USER_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Get Feed** (posts from users you follow):
```bash
curl -X GET http://localhost:3000/posts/feed \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Unlike a Post:**
```bash
curl -X POST http://localhost:3000/posts/POST_ID/unlike \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Get Single Post:**
```bash
curl -X GET http://localhost:3000/posts/POST_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 5. Test Admin Endpoints

**Login as Admin:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "adminpass123"
  }'
```

**Get Admin Profile:**
```bash
curl -X GET http://localhost:3000/admins/profile \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

### 6. Test Role-Based Access Control

**Try to create a post as admin** (should fail):
```bash
curl -X POST http://localhost:3000/posts \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "This should fail"
  }'
```

Expected response: 403 Forbidden - "Insufficient permissions"

**Try to access admin endpoint as user** (should fail):
```bash
curl -X GET http://localhost:3000/admins/profile \
  -H "Authorization: Bearer USER_ACCESS_TOKEN"
```

Expected response: 403 Forbidden - "Insufficient permissions"

## Using Postman

1. Import the `postman_collection.json` file into Postman
2. Set the `baseUrl` variable to `http://localhost:3000`
3. After login, copy the `access_token` from the response
4. Set the `accessToken` variable in Postman
5. All authenticated requests will now work

## Verifying Data in Neo4j

1. Open Neo4j Browser at `http://localhost:7474`
2. Login with username: `neo4j`, password: `password` (or your configured password)
3. Run Cypher queries to view the data:

```cypher
// View all users
MATCH (u:User) RETURN u;

// View all relationships
MATCH (n)-[r]->(m) RETURN n, r, m LIMIT 50;

// View social graph
MATCH (u1:User)-[:FOLLOWS]->(u2:User)
RETURN u1.username, u2.username;

// View posts with likes
MATCH (u:User)-[:POSTED]->(p:Post)
OPTIONAL MATCH (p)<-[:LIKES]-(liker:User)
RETURN u.username, p.content, count(liker) as likes;
```

## Common Issues

### 1. "Neo4j connection established successfully" not appearing
- Check that Neo4j is running
- Verify NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD in .env
- Ensure Neo4j is accessible on the configured port

### 2. "Invalid credentials" when logging in
- Verify username and password are correct
- Check if the user was successfully registered

### 3. "User not found" when following
- Ensure you're using the correct user ID (UUID)
- You can get user IDs from the registration or profile response

### 4. Empty feed
- Make sure you're following other users
- Ensure the users you follow have created posts
- Posts must be created AFTER you followed the user

## Testing Scenarios

### Scenario 1: Social Network Flow
1. Register 3 users: Alice, Bob, Charlie
2. Alice follows Bob and Charlie
3. Bob creates a post
4. Charlie creates a post
5. Alice gets feed (should see Bob's and Charlie's posts)
6. Alice likes Bob's post
7. View Bob's post to see the like count

### Scenario 2: Role-Based Access
1. Register a user and an admin
2. Login as user - try to access admin endpoint (should fail)
3. Login as admin - try to create a post (should fail)
4. Login as user - create a post (should succeed)
5. Login as admin - get admin profile (should succeed)

### Scenario 3: Graph Relationships
1. Register 4 users: A, B, C, D
2. A follows B, B follows C, C follows D
3. Each user creates a post
4. Login as A - feed should show only B's posts
5. Login as B - feed should show only C's posts
6. A follows C - now A's feed shows B's and C's posts
