# Neo4j Setup and Queries

## Initial Setup

After starting Neo4j, you can use these Cypher queries to set up constraints and indexes for better performance.

### Create Constraints

```cypher
// Ensure User IDs are unique
CREATE CONSTRAINT user_id_unique IF NOT EXISTS
FOR (u:User) REQUIRE u.id IS UNIQUE;

// Ensure Admin IDs are unique
CREATE CONSTRAINT admin_id_unique IF NOT EXISTS
FOR (a:Admin) REQUIRE a.id IS UNIQUE;

// Ensure Post IDs are unique
CREATE CONSTRAINT post_id_unique IF NOT EXISTS
FOR (p:Post) REQUIRE p.id IS UNIQUE;

// Ensure User usernames are unique
CREATE CONSTRAINT user_username_unique IF NOT EXISTS
FOR (u:User) REQUIRE u.username IS UNIQUE;

// Ensure Admin usernames are unique
CREATE CONSTRAINT admin_username_unique IF NOT EXISTS
FOR (a:Admin) REQUIRE a.username IS UNIQUE;
```

### Create Indexes

```cypher
// Index on User email for faster lookups
CREATE INDEX user_email_index IF NOT EXISTS
FOR (u:User) ON (u.email);

// Index on Admin email for faster lookups
CREATE INDEX admin_email_index IF NOT EXISTS
FOR (a:Admin) ON (a.email);

// Index on Post createdAt for faster feed queries
CREATE INDEX post_created_index IF NOT EXISTS
FOR (p:Post) ON (p.createdAt);
```

## Example Queries

### Find User's Network

```cypher
// Find all users a specific user follows
MATCH (u:User {username: 'john_doe'})-[:FOLLOWS]->(following:User)
RETURN following.username, following.email;

// Find all followers of a user
MATCH (follower:User)-[:FOLLOWS]->(u:User {username: 'john_doe'})
RETURN follower.username, follower.email;

// Find mutual follows (friends)
MATCH (u1:User {username: 'john_doe'})-[:FOLLOWS]->(u2:User)-[:FOLLOWS]->(u1)
RETURN u2.username, u2.email;
```

### Posts and Engagement

```cypher
// Find all posts by a user with like counts
MATCH (u:User {username: 'john_doe'})-[:POSTED]->(p:Post)
OPTIONAL MATCH (p)<-[:LIKES]-(liker:User)
WITH p, u, count(liker) as likesCount
RETURN p.id, p.content, p.createdAt, likesCount
ORDER BY p.createdAt DESC;

// Find users who liked a specific post
MATCH (u:User)-[:LIKES]->(p:Post {id: 'post-uuid'})
RETURN u.username, u.email;

// Get personalized feed (posts from followed users)
MATCH (me:User {username: 'john_doe'})-[:FOLLOWS]->(followed:User)-[:POSTED]->(p:Post)
OPTIONAL MATCH (p)<-[:LIKES]-(liker:User)
WITH p, followed, count(liker) as likesCount
RETURN p.id, p.content, followed.username as author, p.createdAt, likesCount
ORDER BY p.createdAt DESC
LIMIT 50;
```

### Advanced Social Queries

```cypher
// Find suggested users to follow (friends of friends)
MATCH (me:User {username: 'john_doe'})-[:FOLLOWS]->(:User)-[:FOLLOWS]->(suggested:User)
WHERE NOT (me)-[:FOLLOWS]->(suggested) AND me <> suggested
RETURN DISTINCT suggested.username, suggested.email
LIMIT 10;

// Find most popular users by follower count
MATCH (u:User)<-[:FOLLOWS]-(follower:User)
WITH u, count(follower) as followerCount
RETURN u.username, u.email, followerCount
ORDER BY followerCount DESC
LIMIT 20;

// Find most active users by post count
MATCH (u:User)-[:POSTED]->(p:Post)
WITH u, count(p) as postCount
RETURN u.username, u.email, postCount
ORDER BY postCount DESC
LIMIT 20;

// Find trending posts (most liked in last 24 hours)
MATCH (p:Post)
WHERE p.createdAt > datetime() - duration({hours: 24})
OPTIONAL MATCH (p)<-[:LIKES]-(liker:User)
WITH p, count(liker) as likesCount
MATCH (author:User)-[:POSTED]->(p)
RETURN p.id, p.content, author.username, p.createdAt, likesCount
ORDER BY likesCount DESC
LIMIT 20;
```

### Clear All Data (for testing)

```cypher
// WARNING: This will delete ALL data in your database
MATCH (n)
DETACH DELETE n;
```

### View Database Statistics

```cypher
// Count all nodes by type
MATCH (n)
RETURN labels(n)[0] as NodeType, count(*) as Count;

// Count all relationships by type
MATCH ()-[r]->()
RETURN type(r) as RelationshipType, count(*) as Count;

// View sample data
MATCH (u:User)-[r]->(target)
RETURN u.username, type(r), labels(target)[0], target.username
LIMIT 25;
```
