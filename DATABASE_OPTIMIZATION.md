# Database Optimization Guide

## Phase 2: Performance Optimization

### 1. Database Indexes

Add indexes on frequently queried columns:

```sql
-- Products table
CREATE INDEX idx_products_categoryId ON products(categoryId);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_createdAt ON products(createdAt);

-- News table
CREATE INDEX idx_news_slug ON news(slug);
CREATE INDEX idx_news_published ON news(published);
CREATE INDEX idx_news_createdAt ON news(createdAt);

-- Contacts table
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_createdAt ON contacts(createdAt);

-- Newsletter subscribers
CREATE INDEX idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX idx_newsletter_active ON newsletter_subscribers(isActive);

-- Job applications
CREATE INDEX idx_job_applications_positionId ON job_applications(positionId);
CREATE INDEX idx_job_applications_createdAt ON job_applications(createdAt);

-- Activity logs
CREATE INDEX idx_activity_logs_userId ON activity_logs(userId);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_createdAt ON activity_logs(createdAt);

-- Notification center
CREATE INDEX idx_notifications_userId ON notification_center(userId);
CREATE INDEX idx_notifications_read ON notification_center(isRead);
CREATE INDEX idx_notifications_createdAt ON notification_center(createdAt);
```

### 2. Query Optimization

#### Products List Query
```typescript
// Before: N+1 query problem
const products = await db.select().from(products);

// After: Single query with join
const products = await db
  .select({
    id: products.id,
    name: products.name,
    price: products.price,
    categoryName: categories.name,
  })
  .from(products)
  .leftJoin(categories, eq(products.categoryId, categories.id))
  .orderBy(desc(products.createdAt))
  .limit(20);
```

#### News with Pagination
```typescript
// Use offset + limit for pagination
const page = 1;
const pageSize = 10;

const news = await db
  .select()
  .from(newsTable)
  .where(eq(newsTable.published, true))
  .orderBy(desc(newsTable.createdAt))
  .limit(pageSize)
  .offset((page - 1) * pageSize);

// Get total count separately (cached)
const total = await db
  .select({ count: count() })
  .from(newsTable)
  .where(eq(newsTable.published, true));
```

### 3. Connection Pooling

```typescript
// MySQL connection pool configuration
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
```

### 4. Query Caching

```typescript
// Cache frequently accessed data
const CACHE_DURATION = 3600; // 1 hour

async function getCategoriesWithCache() {
  const cacheKey = 'categories:all';
  
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Query database
  const categories = await db.select().from(categoriesTable);
  
  // Store in cache
  await redis.setex(cacheKey, CACHE_DURATION, JSON.stringify(categories));
  
  return categories;
}
```

### 5. Lazy Loading

```typescript
// Load related data only when needed
async function getProductWithDetails(id: number) {
  const product = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);
  
  // Load specifications separately
  const specifications = await db
    .select()
    .from(productSpecifications)
    .where(eq(productSpecifications.productId, id));
  
  return {
    ...product,
    specifications,
  };
}
```

### 6. Batch Operations

```typescript
// Insert multiple records efficiently
async function bulkInsertProducts(productsData: any[]) {
  await db.insert(products).values(productsData);
}

// Update multiple records
async function bulkUpdateStatus(ids: number[], status: string) {
  await db
    .update(products)
    .set({ status })
    .where(inArray(products.id, ids));
}
```

### 7. Query Analysis

```sql
-- Analyze query performance
EXPLAIN SELECT * FROM products WHERE categoryId = 1 ORDER BY createdAt DESC;

-- Check index usage
SHOW INDEX FROM products;

-- Monitor slow queries
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;
```

### 8. Database Maintenance

```sql
-- Optimize tables
OPTIMIZE TABLE products;
OPTIMIZE TABLE news;
OPTIMIZE TABLE contacts;

-- Analyze tables
ANALYZE TABLE products;
ANALYZE TABLE news;

-- Repair tables
REPAIR TABLE products;
```

### 9. Replication & Backup

```bash
# Backup database
mysqldump -u root -p dreamweldtech > backup.sql

# Restore database
mysql -u root -p dreamweldtech < backup.sql

# Incremental backup
mysqldump -u root -p --single-transaction --master-data dreamweldtech > backup.sql
```

### 10. Monitoring

```typescript
// Monitor query performance
async function monitorQuery(queryName: string, fn: () => Promise<any>) {
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;
  
  console.log(`[Query] ${queryName}: ${duration}ms`);
  
  if (duration > 1000) {
    console.warn(`[Slow Query] ${queryName}: ${duration}ms`);
  }
  
  return result;
}
```

## Performance Targets

- Query response time: < 100ms
- Database connection time: < 50ms
- Bulk insert (1000 records): < 5s
- Index lookup: < 10ms

## Checklist

- [x] Add indexes on foreign keys
- [x] Add indexes on search columns
- [x] Add indexes on sort columns
- [x] Optimize N+1 queries
- [x] Implement connection pooling
- [x] Add query caching
- [x] Implement lazy loading
- [x] Batch operations
- [x] Regular maintenance
- [x] Query monitoring
