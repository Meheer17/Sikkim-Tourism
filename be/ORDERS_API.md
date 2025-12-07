# Orders API Documentation

## Overview
The Orders API allows users to create and manage orders for services provided by businesses. Each order includes payment status tracking, order status management, and flexible metadata for storing additional data like booking times.

## Base URL
```
/api/v1/orders
```

## Data Models

### Order Object
```json
{
  "id": "string (ObjectId)",
  "service_id": "string (ObjectId) - references service._id",
  "business_id": "string (ObjectId) - references business._id",
  "user_id": "string (ObjectId) - references user._id",
  "payment_status": "pending | completed | failed | refunded",
  "order_status": "created | confirmed | in_progress | completed | cancelled",
  "amount": "number (≥0)",
  "metadata": "object (optional) - e.g., {from_time: '10:00', to_time: '14:00', quantity: 2, notes: '...'}",
  "created_at": "ISO 8601 datetime",
  "updated_at": "ISO 8601 datetime"
}
```

### PaymentStatus
- `pending`: Payment awaiting completion
- `completed`: Payment successfully processed
- `failed`: Payment transaction failed
- `refunded`: Payment has been refunded

### OrderStatus
- `created`: Order just created
- `confirmed`: Order confirmed by business
- `in_progress`: Order is being fulfilled
- `completed`: Order completed
- `cancelled`: Order cancelled

## Endpoints

### 1. Create Order
**POST** `/api/v1/orders/`

Creates a new order for a service.

**Request Body:**
```json
{
  "service_id": "string (ObjectId)",
  "business_id": "string (ObjectId)",
  "amount": "number",
  "metadata": {
    "from_time": "HH:MM",
    "to_time": "HH:MM",
    "quantity": 1,
    "notes": "string",
    ...
  }
}
```

**Response:** 
- Status: `201 Created`
- Body: Order object

**Example:**
```bash
curl -X POST http://localhost:8000/api/v1/orders/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "service_id": "507f1f77bcf86cd799439011",
    "business_id": "507f1f77bcf86cd799439012",
    "amount": 2500.00,
    "metadata": {
      "from_time": "10:00",
      "to_time": "14:00",
      "quantity": 2,
      "notes": "Group booking"
    }
  }'
```

---

### 2. List Orders
**GET** `/api/v1/orders/`

Retrieves all orders with optional filtering and pagination.

**Query Parameters:**
- `skip` (integer, default: 0) - Number of records to skip
- `limit` (integer, default: 10) - Number of records to return
- `service_id` (string, optional) - Filter by service ID
- `business_id` (string, optional) - Filter by business ID
- `user_id` (string, optional) - Filter by user ID
- `payment_status` (string, optional) - Filter by payment status
- `order_status` (string, optional) - Filter by order status

**Response:** 
- Status: `200 OK`
- Body: Array of Order objects

**Example:**
```bash
curl -X GET "http://localhost:8000/api/v1/orders/?business_id=507f1f77bcf86cd799439012&order_status=completed" \
  -H "Authorization: Bearer <token>"
```

---

### 3. Get My Orders
**GET** `/api/v1/orders/me`

Retrieves all orders created by the authenticated user.

**Query Parameters:**
- `skip` (integer, default: 0)
- `limit` (integer, default: 10)

**Response:** 
- Status: `200 OK`
- Body: Array of Order objects

**Example:**
```bash
curl -X GET "http://localhost:8000/api/v1/orders/me" \
  -H "Authorization: Bearer <token>"
```

---

### 4. Get Order by ID
**GET** `/api/v1/orders/{order_id}`

Retrieves a specific order by ID.

**Path Parameters:**
- `order_id` (string, required) - Order ID

**Response:** 
- Status: `200 OK`
- Body: Order object

**Errors:**
- Status: `404 Not Found` - Order not found

---

### 5. Update Order
**PUT** `/api/v1/orders/{order_id}`

Updates an existing order (e.g., change payment status, order status, metadata).

**Path Parameters:**
- `order_id` (string, required) - Order ID

**Request Body:**
```json
{
  "payment_status": "string (optional)",
  "order_status": "string (optional)",
  "amount": "number (optional)",
  "metadata": "object (optional)"
}
```

**Response:** 
- Status: `200 OK`
- Body: Updated Order object

**Example - Mark payment as completed:**
```bash
curl -X PUT http://localhost:8000/api/v1/orders/507f1f77bcf86cd799439013 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_status": "completed",
    "order_status": "confirmed"
  }'
```

---

### 6. Delete Order
**DELETE** `/api/v1/orders/{order_id}`

Deletes an order.

**Path Parameters:**
- `order_id` (string, required) - Order ID

**Response:** 
- Status: `200 OK`
- Body: `{"message": "Order deleted successfully"}`

**Errors:**
- Status: `404 Not Found` - Order not found

---

### 7. Get Business Orders
**GET** `/api/v1/orders/business/{business_id}`

Retrieves all orders for a specific business.

**Path Parameters:**
- `business_id` (string, required) - Business ID

**Query Parameters:**
- `skip` (integer, default: 0)
- `limit` (integer, default: 10)

**Response:** 
- Status: `200 OK`
- Body: Array of Order objects

---

## Metadata Examples

### Booking/Tour Order
```json
{
  "from_time": "09:00",
  "to_time": "17:00",
  "date": "2025-12-20",
  "num_people": 4,
  "special_requests": "Vegetarian meals required"
}
```

### Transportation Order
```json
{
  "pickup_location": "Hotel XYZ",
  "dropoff_location": "Airport",
  "vehicle_type": "SUV",
  "seats": 4,
  "pickup_time": "06:00"
}
```

### Restaurant/Entry Ticket Order
```json
{
  "reservation_time": "19:30",
  "num_guests": 6,
  "special_requirements": "Window seating preferred",
  "external_id": "TICKET-12345"
}
```

### Generic Service Order
```json
{
  "quantity": 2,
  "duration_hours": 3,
  "notes": "Custom notes for the business"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Invalid service ID" | "Invalid business ID" | "No fields to update"
}
```

### 404 Not Found
```json
{
  "detail": "Order not found" | "Service not found" | "Business not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Database not connected" | "Failed to create order" | "Failed to update order"
}
```

## Authentication
All endpoints require authentication via Bearer token in the `Authorization` header:
```
Authorization: Bearer <your_jwt_token>
```

## Usage Flow Example

```bash
# 1. Create an order
ORDER_ID=$(curl -X POST http://localhost:8000/api/v1/orders/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "service_id": "507f1f77bcf86cd799439011",
    "business_id": "507f1f77bcf86cd799439012",
    "amount": 5000,
    "metadata": {"from_time": "10:00", "to_time": "14:00"}
  }' | jq -r '.id')

# 2. Retrieve the order
curl -X GET http://localhost:8000/api/v1/orders/$ORDER_ID \
  -H "Authorization: Bearer <token>"

# 3. Update payment status
curl -X PUT http://localhost:8000/api/v1/orders/$ORDER_ID \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"payment_status": "completed", "order_status": "confirmed"}'

# 4. Get all my orders
curl -X GET http://localhost:8000/api/v1/orders/me \
  -H "Authorization: Bearer <token>"
```

## Database Schema

### orders collection
```javascript
{
  _id: ObjectId,
  service_id: ObjectId,           // references services._id
  business_id: ObjectId,          // references business._id
  user_id: ObjectId,              // references users._id
  payment_status: String,         // pending, completed, failed, refunded
  order_status: String,           // created, confirmed, in_progress, completed, cancelled
  amount: Number,                 // order total amount
  metadata: Object,               // flexible object for custom data
  created_at: ISODate,
  updated_at: ISODate
}
```

**Indexes (recommended):**
```javascript
db.orders.createIndex({ user_id: 1, created_at: -1 })
db.orders.createIndex({ business_id: 1, created_at: -1 })
db.orders.createIndex({ service_id: 1 })
db.orders.createIndex({ payment_status: 1 })
db.orders.createIndex({ order_status: 1 })
```
