# Dreamweldtech API Documentation

## Overview

RESTful API built with tRPC and Express.js. All endpoints are prefixed with `/api/trpc/`.

## Authentication

All protected endpoints require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

## Base URL

```
https://dreamweldtech.com/api/trpc
```

## Response Format

All responses follow the tRPC format:

```json
{
  "result": {
    "data": {}
  }
}
```

## Error Handling

Errors are returned with appropriate HTTP status codes:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

## Endpoints

### Authentication

#### Login
```
POST /auth.login
Body: { email: string, password: string }
Response: { token: string, user: User }
```

#### Register
```
POST /auth.register
Body: { email: string, password: string, name: string }
Response: { token: string, user: User }
```

#### Get Current User
```
GET /auth.me
Headers: Authorization required
Response: { user: User }
```

#### Logout
```
POST /auth.logout
Headers: Authorization required
Response: { success: boolean }
```

### Products

#### List Products
```
GET /products.list?page=1&limit=20&categoryId=1
Response: { products: Product[], total: number }
```

#### Get Product
```
GET /products.get?id=1
Response: { product: Product }
```

#### Create Product (Admin)
```
POST /products.create
Headers: Authorization required
Body: { name, slug, description, price, categoryId, image }
Response: { product: Product }
```

#### Update Product (Admin)
```
PATCH /products.update
Headers: Authorization required
Body: { id, name, slug, description, price, categoryId, image }
Response: { product: Product }
```

#### Delete Product (Admin)
```
DELETE /products.delete?id=1
Headers: Authorization required
Response: { success: boolean }
```

### News

#### List News
```
GET /news.list?page=1&limit=10&published=true
Response: { news: News[], total: number }
```

#### Get News Article
```
GET /news.get?slug=article-slug
Response: { article: News }
```

#### Create News (Admin)
```
POST /news.create
Headers: Authorization required
Body: { title, slug, content, excerpt, image, published }
Response: { article: News }
```

#### Update News (Admin)
```
PATCH /news.update
Headers: Authorization required
Body: { id, title, slug, content, excerpt, image, published }
Response: { article: News }
```

### Contacts

#### Create Contact Request
```
POST /contacts.create
Body: { name, email, phone, company, subject, message }
Response: { contact: ContactRequest }
```

#### List Contacts (Admin)
```
GET /contacts.list?page=1&limit=20
Headers: Authorization required
Response: { contacts: ContactRequest[], total: number }
```

#### Get Contact (Admin)
```
GET /contacts.get?id=1
Headers: Authorization required
Response: { contact: ContactRequest }
```

### Newsletter

#### Subscribe
```
POST /newsletter.subscribe
Body: { email, name }
Response: { subscriber: NewsletterSubscriber }
```

#### Unsubscribe
```
POST /newsletter.unsubscribe
Body: { email }
Response: { success: boolean }
```

#### List Subscribers (Admin)
```
GET /newsletter.list?page=1&limit=50
Headers: Authorization required
Response: { subscribers: NewsletterSubscriber[], total: number }
```

### Job Applications

#### Create Application
```
POST /jobApplications.create
Body: { fullName, email, phone, position, experience, coverLetter, resume }
Response: { application: JobApplication }
```

#### List Applications (Admin)
```
GET /jobApplications.list?page=1&limit=20&status=pending
Headers: Authorization required
Response: { applications: JobApplication[], total: number }
```

#### Update Application Status (Admin)
```
PATCH /jobApplications.updateStatus
Headers: Authorization required
Body: { id, status }
Response: { application: JobApplication }
```

### Activity Log (Admin)

#### List Activity
```
GET /activityLog.list?page=1&limit=50&action=create&entityType=product
Headers: Authorization required
Response: { logs: ActivityLog[], total: number }
```

### Notifications (Admin)

#### Get Notifications
```
GET /notificationCenter.list?page=1&limit=20
Headers: Authorization required
Response: { notifications: Notification[], total: number }
```

#### Get Unread Count
```
GET /notificationCenter.unreadCount
Headers: Authorization required
Response: { count: number }
```

#### Mark as Read
```
PATCH /notificationCenter.markAsRead
Headers: Authorization required
Body: { id }
Response: { success: boolean }
```

### Admin Roles

#### List Roles
```
GET /adminRoles.list
Headers: Authorization required
Response: { roles: AdminRole[] }
```

## Rate Limiting

API endpoints are rate limited based on endpoint type:

- **General API**: 100 requests per 15 minutes
- **Auth**: 5 attempts per 15 minutes
- **Contact Form**: 3 submissions per hour
- **Newsletter**: 5 subscriptions per day
- **Job Applications**: 10 applications per day
- **Search**: 60 searches per minute
- **Admin**: 1000 requests per hour

## Pagination

Paginated endpoints accept:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

Response includes:
- `data`: Array of items
- `total`: Total number of items
- `page`: Current page
- `limit`: Items per page

## Filtering

Supported filter parameters vary by endpoint. Common filters:

- `search`: Search by name/title/content
- `status`: Filter by status
- `categoryId`: Filter by category
- `published`: Filter by published status
- `createdAfter`: Filter by creation date
- `createdBefore`: Filter by creation date

## Sorting

Supported sort parameters:

- `sortBy`: Field to sort by (default: createdAt)
- `sortOrder`: asc or desc (default: desc)

## Examples

### Get Products with Filters
```bash
curl -X GET "https://dreamweldtech.com/api/trpc/products.list?page=1&limit=20&categoryId=1&sortBy=price&sortOrder=asc"
```

### Create Contact Request
```bash
curl -X POST "https://dreamweldtech.com/api/trpc/contacts.create" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+84123456789",
    "company": "ABC Corp",
    "subject": "Laser Welding Inquiry",
    "message": "I am interested in your laser welding machines..."
  }'
```

### Subscribe to Newsletter
```bash
curl -X POST "https://dreamweldtech.com/api/trpc/newsletter.subscribe" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe"
  }'
```

### Admin: List Products
```bash
curl -X GET "https://dreamweldtech.com/api/trpc/products.list?page=1&limit=50" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## WebSocket

Real-time notifications available via WebSocket:

```
wss://dreamweldtech.com/api/ws/notifications
```

### Subscribe to Notifications
```json
{
  "type": "subscribe",
  "userId": 123
}
```

### Receive Notification
```json
{
  "type": "notification",
  "title": "New Contact Request",
  "message": "You have a new contact request from John Doe",
  "priority": "normal",
  "timestamp": "2026-01-02T09:00:00Z"
}
```

## Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created
- `204 No Content`: Request successful, no content
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Permission denied
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

## Changelog

### v1.0.0 (2026-01-02)
- Initial API release
- Authentication endpoints
- Product management
- News management
- Contact requests
- Newsletter subscription
- Job applications
- Admin features
- Activity logging
- Real-time notifications
