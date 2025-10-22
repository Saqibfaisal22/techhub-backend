# Admin Dashboard API Documentation

This document outlines all the API endpoints required for the Admin Dashboard to function properly.

**Base URL:** `process.env.NEXT_PUBLIC_API_URL`

**Authentication:** All endpoints (except login) require an `Authorization: Bearer <token>` header.

---

## Authentication

### POST /api/admin/login
Login to admin dashboard.

**Request Body:**
\`\`\`json
{
  "email": "admin@techhub.com",
  "password": "admin123"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "1",
    "name": "Admin User",
    "email": "admin@techhub.com",
    "role": "admin"
  }
}
\`\`\`

**Response (401):**
\`\`\`json
{
  "success": false,
  "message": "Invalid credentials"
}
\`\`\`

---

## Dashboard Analytics

### GET /api/admin/analytics/stats
Get overview statistics for dashboard.

**Response (200):**
\`\`\`json
{
  "totalRevenue": 125430,
  "totalOrders": 1234,
  "totalUsers": 5678,
  "totalProducts": 234
}
\`\`\`

### GET /api/admin/analytics/sales
Get sales data for chart (last 7 days).

**Response (200):**
\`\`\`json
{
  "data": [
    { "date": "2025-03-27", "sales": 4200 },
    { "date": "2025-03-28", "sales": 3800 },
    { "date": "2025-03-29", "sales": 5100 },
    { "date": "2025-03-30", "sales": 4600 },
    { "date": "2025-03-31", "sales": 5400 },
    { "date": "2025-04-01", "sales": 6200 },
    { "date": "2025-04-02", "sales": 5800 }
  ]
}
\`\`\`

### GET /api/admin/analytics/users
Get user growth data for chart (last 7 days).

**Response (200):**
\`\`\`json
{
  "data": [
    { "date": "2025-03-27", "users": 120 },
    { "date": "2025-03-28", "users": 145 },
    { "date": "2025-03-29", "users": 167 },
    { "date": "2025-03-30", "users": 189 },
    { "date": "2025-03-31", "users": 203 },
    { "date": "2025-04-01", "users": 225 },
    { "date": "2025-04-02", "users": 248 }
  ]
}
\`\`\`

### GET /api/admin/analytics/orders
Get orders data for chart (last 7 days).

**Response (200):**
\`\`\`json
{
  "data": [
    { "date": "2025-03-27", "orders": 45 },
    { "date": "2025-03-28", "orders": 52 },
    { "date": "2025-03-29", "orders": 48 },
    { "date": "2025-03-30", "orders": 61 },
    { "date": "2025-03-31", "orders": 55 },
    { "date": "2025-04-01", "orders": 68 },
    { "date": "2025-04-02", "orders": 72 }
  ]
}
\`\`\`

### GET /api/admin/analytics/recent-orders
Get recent orders for dashboard (limit 5).

**Response (200):**
\`\`\`json
{
  "orders": [
    {
      "id": "ORD-001",
      "customer": "John Doe",
      "amount": 299.99,
      "status": "completed",
      "date": "2025-04-02T10:30:00Z"
    },
    {
      "id": "ORD-002",
      "customer": "Jane Smith",
      "amount": 149.99,
      "status": "processing",
      "date": "2025-04-02T09:15:00Z"
    }
  ]
}
\`\`\`

---

## User Management

### GET /api/admin/users
Get all users with pagination and search.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search by name or email

**Example:** `/api/admin/users?page=1&limit=10&search=john`

**Response (200):**
\`\`\`json
{
  "users": [
    {
      "id": "1",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer",
      "status": "active",
      "joinedDate": "2024-01-15T08:00:00Z",
      "totalOrders": 12,
      "totalSpent": 2499.88
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalUsers": 100,
    "limit": 10
  }
}
\`\`\`

### GET /api/admin/users/:id
Get single user details.

**Response (200):**
\`\`\`json
{
  "id": "1",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "role": "customer",
  "status": "active",
  "joinedDate": "2024-01-15T08:00:00Z",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "country": "USA"
  },
  "stats": {
    "totalOrders": 12,
    "totalSpent": 2499.88,
    "averageOrderValue": 208.32
  },
  "recentOrders": [
    {
      "id": "ORD-123",
      "date": "2025-03-28T10:00:00Z",
      "total": 299.99,
      "status": "completed"
    }
  ]
}
\`\`\`

### PUT /api/admin/users/:id
Update user details.

**Request Body:**
\`\`\`json
{
  "name": "John Doe Updated",
  "email": "john.updated@example.com",
  "phone": "+1234567890",
  "role": "customer",
  "status": "active"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "message": "User updated successfully",
  "user": {
    "id": "1",
    "name": "John Doe Updated",
    "email": "john.updated@example.com",
    "phone": "+1234567890",
    "role": "customer",
    "status": "active"
  }
}
\`\`\`

### DELETE /api/admin/users/:id
Delete a user.

**Response (200):**
\`\`\`json
{
  "success": true,
  "message": "User deleted successfully"
}
\`\`\`

---

## Product Management

### GET /api/admin/products
Get all products with pagination and search.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search by name or SKU
- `category` (optional): Filter by category
- `status` (optional): Filter by status (active/inactive)

**Example:** `/api/admin/products?page=1&limit=10&search=laptop&category=electronics`

**Response (200):**
\`\`\`json
{
  "products": [
    {
      "id": "1",
      "name": "Gaming Laptop Pro",
      "sku": "LAP-001",
      "category": "Electronics",
      "price": 1299.99,
      "stock": 45,
      "status": "active",
      "image": "/images/laptop.jpg"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalProducts": 50,
    "limit": 10
  }
}
\`\`\`

### GET /api/admin/products/:id
Get single product details.

**Response (200):**
\`\`\`json
{
  "id": "1",
  "name": "Gaming Laptop Pro",
  "sku": "LAP-001",
  "description": "High-performance gaming laptop with RTX 4080",
  "category": "Electronics",
  "price": 1299.99,
  "comparePrice": 1499.99,
  "cost": 899.99,
  "stock": 45,
  "status": "active",
  "images": [
    "/images/laptop-1.jpg",
    "/images/laptop-2.jpg"
  ],
  "specifications": {
    "processor": "Intel i9",
    "ram": "32GB",
    "storage": "1TB SSD"
  },
  "createdAt": "2024-01-15T08:00:00Z",
  "updatedAt": "2025-03-28T10:00:00Z"
}
\`\`\`

### POST /api/admin/products
Create new product.

**Request Body:**
\`\`\`json
{
  "name": "Gaming Laptop Pro",
  "sku": "LAP-001",
  "description": "High-performance gaming laptop",
  "category": "Electronics",
  "price": 1299.99,
  "comparePrice": 1499.99,
  "cost": 899.99,
  "stock": 45,
  "status": "active",
  "images": ["/images/laptop.jpg"]
}
\`\`\`

**Response (201):**
\`\`\`json
{
  "success": true,
  "message": "Product created successfully",
  "product": {
    "id": "1",
    "name": "Gaming Laptop Pro",
    "sku": "LAP-001",
    "price": 1299.99,
    "stock": 45,
    "status": "active"
  }
}
\`\`\`

### PUT /api/admin/products/:id
Update product.

**Request Body:** (Same as POST)

**Response (200):**
\`\`\`json
{
  "success": true,
  "message": "Product updated successfully",
  "product": { /* updated product data */ }
}
\`\`\`

### DELETE /api/admin/products/:id
Delete product.

**Response (200):**
\`\`\`json
{
  "success": true,
  "message": "Product deleted successfully"
}
\`\`\`

---

## Order Management

### GET /api/admin/orders
Get all orders with filters.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status (pending/processing/shipped/delivered/cancelled)
- `startDate` (optional): Filter from date (ISO format)
- `endDate` (optional): Filter to date (ISO format)
- `userId` (optional): Filter by user ID

**Example:** `/api/admin/orders?page=1&status=processing&startDate=2025-03-01`

**Response (200):**
\`\`\`json
{
  "orders": [
    {
      "id": "ORD-001",
      "orderNumber": "#12345",
      "customer": "John Doe",
      "email": "john@example.com",
      "total": 299.99,
      "status": "processing",
      "date": "2025-04-02T10:30:00Z",
      "items": 3
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 20,
    "totalOrders": 200,
    "limit": 10
  }
}
\`\`\`

### GET /api/admin/orders/:id
Get single order details.

**Response (200):**
\`\`\`json
{
  "id": "ORD-001",
  "orderNumber": "#12345",
  "status": "processing",
  "date": "2025-04-02T10:30:00Z",
  "customer": {
    "id": "1",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890"
  },
  "shippingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "country": "USA"
  },
  "items": [
    {
      "id": "1",
      "productId": "1",
      "name": "Gaming Laptop Pro",
      "sku": "LAP-001",
      "quantity": 1,
      "price": 1299.99,
      "total": 1299.99,
      "image": "/images/laptop.jpg"
    }
  ],
  "summary": {
    "subtotal": 1299.99,
    "shipping": 20.00,
    "tax": 104.00,
    "total": 1423.99
  },
  "payment": {
    "method": "Credit Card",
    "status": "paid",
    "transactionId": "TXN-123456"
  },
  "timeline": [
    {
      "status": "pending",
      "date": "2025-04-02T10:30:00Z",
      "note": "Order placed"
    },
    {
      "status": "processing",
      "date": "2025-04-02T11:00:00Z",
      "note": "Payment confirmed"
    }
  ]
}
\`\`\`

### PUT /api/admin/orders/:id/status
Update order status.

**Request Body:**
\`\`\`json
{
  "status": "shipped",
  "note": "Order shipped via FedEx. Tracking: 1234567890"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "message": "Order status updated successfully",
  "order": {
    "id": "ORD-001",
    "status": "shipped"
  }
}
\`\`\`

---

## Support Tickets

### GET /api/admin/tickets
Get all support tickets with filters.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status (open/in-progress/resolved/closed)
- `priority` (optional): Filter by priority (low/medium/high/urgent)

**Example:** `/api/admin/tickets?page=1&status=open&priority=high`

**Response (200):**
\`\`\`json
{
  "tickets": [
    {
      "id": "TKT-001",
      "subject": "Product not delivered",
      "customer": "John Doe",
      "email": "john@example.com",
      "status": "open",
      "priority": "high",
      "category": "Delivery",
      "createdAt": "2025-04-01T14:30:00Z",
      "lastReply": "2025-04-02T09:15:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalTickets": 50,
    "limit": 10
  }
}
\`\`\`

### GET /api/admin/tickets/:id
Get single ticket details with messages.

**Response (200):**
\`\`\`json
{
  "id": "TKT-001",
  "ticketNumber": "#TKT-001",
  "subject": "Product not delivered",
  "status": "open",
  "priority": "high",
  "category": "Delivery",
  "createdAt": "2025-04-01T14:30:00Z",
  "customer": {
    "id": "1",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "relatedOrder": {
    "id": "ORD-123",
    "orderNumber": "#12345"
  },
  "messages": [
    {
      "id": "1",
      "sender": "customer",
      "senderName": "John Doe",
      "message": "I ordered a laptop 5 days ago but haven't received it yet.",
      "timestamp": "2025-04-01T14:30:00Z",
      "attachments": []
    },
    {
      "id": "2",
      "sender": "admin",
      "senderName": "Support Team",
      "message": "We're looking into this. Can you provide your order number?",
      "timestamp": "2025-04-01T15:00:00Z",
      "attachments": []
    }
  ]
}
\`\`\`

### PUT /api/admin/tickets/:id/status
Update ticket status.

**Request Body:**
\`\`\`json
{
  "status": "resolved"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "message": "Ticket status updated successfully"
}
\`\`\`

### PUT /api/admin/tickets/:id/priority
Update ticket priority.

**Request Body:**
\`\`\`json
{
  "priority": "urgent"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "message": "Ticket priority updated successfully"
}
\`\`\`

### POST /api/admin/tickets/:id/reply
Reply to a ticket.

**Request Body:**
\`\`\`json
{
  "message": "Your order has been shipped. Tracking number: 1234567890",
  "attachments": []
}
\`\`\`

**Response (201):**
\`\`\`json
{
  "success": true,
  "message": "Reply sent successfully",
  "reply": {
    "id": "3",
    "sender": "admin",
    "senderName": "Support Team",
    "message": "Your order has been shipped. Tracking number: 1234567890",
    "timestamp": "2025-04-02T10:00:00Z"
  }
}
\`\`\`

---

## CMS Pages

### GET /api/admin/cms/pages
Get all CMS pages.

**Response (200):**
\`\`\`json
{
  "pages": [
    {
      "id": "1",
      "title": "About Us",
      "slug": "about-us",
      "status": "published",
      "lastModified": "2025-03-15T10:00:00Z"
    },
    {
      "id": "2",
      "title": "Contact Us",
      "slug": "contact-us",
      "status": "published",
      "lastModified": "2025-03-10T14:30:00Z"
    },
    {
      "id": "3",
      "title": "Privacy Policy",
      "slug": "privacy-policy",
      "status": "published",
      "lastModified": "2025-02-20T09:00:00Z"
    }
  ]
}
\`\`\`

### GET /api/admin/cms/pages/:id
Get single CMS page.

**Response (200):**
\`\`\`json
{
  "id": "1",
  "title": "About Us",
  "slug": "about-us",
  "content": "<h1>About Our Company</h1><p>We are a leading tech company...</p>",
  "metaTitle": "About Us - TechHub",
  "metaDescription": "Learn more about TechHub and our mission",
  "status": "published",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2025-03-15T10:00:00Z"
}
\`\`\`

### PUT /api/admin/cms/pages/:id
Update CMS page.

**Request Body:**
\`\`\`json
{
  "title": "About Us",
  "slug": "about-us",
  "content": "<h1>About Our Company</h1><p>Updated content...</p>",
  "metaTitle": "About Us - TechHub",
  "metaDescription": "Learn more about TechHub",
  "status": "published"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "message": "Page updated successfully",
  "page": {
    "id": "1",
    "title": "About Us",
    "slug": "about-us",
    "status": "published"
  }
}
\`\`\`

---

## Blog Management

### GET /api/admin/blog/posts
Get all blog posts with pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search by title
- `status` (optional): Filter by status (draft/published)

**Example:** `/api/admin/blog/posts?page=1&status=published`

**Response (200):**
\`\`\`json
{
  "posts": [
    {
      "id": "1",
      "title": "10 Best Laptops of 2025",
      "slug": "10-best-laptops-2025",
      "author": "Admin User",
      "status": "published",
      "publishedDate": "2025-03-28T10:00:00Z",
      "views": 1234,
      "image": "/images/blog/laptops.jpg"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalPosts": 100,
    "limit": 10
  }
}
\`\`\`

### GET /api/admin/blog/posts/:id
Get single blog post.

**Response (200):**
\`\`\`json
{
  "id": "1",
  "title": "10 Best Laptops of 2025",
  "slug": "10-best-laptops-2025",
  "content": "<p>Here are the best laptops...</p>",
  "excerpt": "Discover the top laptops for 2025",
  "author": "Admin User",
  "authorId": "1",
  "status": "published",
  "publishedDate": "2025-03-28T10:00:00Z",
  "featuredImage": "/images/blog/laptops.jpg",
  "category": "Reviews",
  "tags": ["laptops", "tech", "reviews"],
  "metaTitle": "10 Best Laptops of 2025 - TechHub Blog",
  "metaDescription": "Comprehensive review of the best laptops",
  "views": 1234,
  "createdAt": "2025-03-27T08:00:00Z",
  "updatedAt": "2025-03-28T10:00:00Z"
}
\`\`\`

### POST /api/admin/blog/posts
Create new blog post.

**Request Body:**
\`\`\`json
{
  "title": "10 Best Laptops of 2025",
  "slug": "10-best-laptops-2025",
  "content": "<p>Here are the best laptops...</p>",
  "excerpt": "Discover the top laptops for 2025",
  "status": "published",
  "featuredImage": "/images/blog/laptops.jpg",
  "category": "Reviews",
  "tags": ["laptops", "tech", "reviews"],
  "metaTitle": "10 Best Laptops of 2025",
  "metaDescription": "Comprehensive review"
}
\`\`\`

**Response (201):**
\`\`\`json
{
  "success": true,
  "message": "Blog post created successfully",
  "post": {
    "id": "1",
    "title": "10 Best Laptops of 2025",
    "slug": "10-best-laptops-2025",
    "status": "published"
  }
}
\`\`\`

### PUT /api/admin/blog/posts/:id
Update blog post.

**Request Body:** (Same as POST)

**Response (200):**
\`\`\`json
{
  "success": true,
  "message": "Blog post updated successfully",
  "post": { /* updated post data */ }
}
\`\`\`

### DELETE /api/admin/blog/posts/:id
Delete blog post.

**Response (200):**
\`\`\`json
{
  "success": true,
  "message": "Blog post deleted successfully"
}
\`\`\`

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
\`\`\`json
{
  "success": false,
  "message": "Invalid request data",
  "errors": {
    "email": "Invalid email format",
    "price": "Price must be a positive number"
  }
}
\`\`\`

### 401 Unauthorized
\`\`\`json
{
  "success": false,
  "message": "Unauthorized. Please login."
}
\`\`\`

### 403 Forbidden
\`\`\`json
{
  "success": false,
  "message": "You don't have permission to access this resource"
}
\`\`\`

### 404 Not Found
\`\`\`json
{
  "success": false,
  "message": "Resource not found"
}
\`\`\`

### 500 Internal Server Error
\`\`\`json
{
  "success": false,
  "message": "Internal server error. Please try again later."
}
\`\`\`

---

## Authentication Flow

1. **Login:** POST to `/api/admin/login` with credentials
2. **Receive Token:** Store the JWT token from response
3. **Authenticated Requests:** Include token in header:
   \`\`\`
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   \`\`\`
4. **Token Expiry:** Tokens expire after 24 hours. Re-login required.

---

## Rate Limiting

- **General endpoints:** 100 requests per minute
- **Login endpoint:** 5 requests per minute
- **Upload endpoints:** 10 requests per minute

---

## Notes

- All dates are in ISO 8601 format (UTC)
- All monetary values are in USD
- File uploads should use `multipart/form-data`
- Maximum file upload size: 10MB
- Supported image formats: JPG, PNG, WebP
- All list endpoints support pagination
- Default page size is 10 items
- Maximum page size is 100 items
