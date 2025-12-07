# Orders & Bookings API - Quick Reference

## 🎯 What Was Built

Complete Orders and Bookings management system with:
- **29 API endpoints** (7 core + 22 specialized)
- **Full CRUD operations** on all operations
- **User perspective** - view and manage own bookings
- **Business perspective** - manage bookings across multiple owned businesses
- **Advanced filtering** - by status, payment status, date
- **Secure access** - JWT-based ownership verification

---

## 📁 Files Created

```
/be/app/models/order.py
/be/app/services/order_service.py
/be/app/api/v1/endpoints/orders.py
/be/app/api/v1/endpoints/bookings.py
/be/ORDERS_API.md (documentation)
/be/BOOKINGS_API.md (documentation)
/be/IMPLEMENTATION_SUMMARY.md (this file)
```

---

## 🔗 API Endpoints by Feature

### Core Orders Management
```
POST   /api/v1/orders/                    Create order
GET    /api/v1/orders/                    List orders
GET    /api/v1/orders/me                  My orders
GET    /api/v1/orders/{id}                Get order
PUT    /api/v1/orders/{id}                Update order
DELETE /api/v1/orders/{id}                Delete order
GET    /api/v1/orders/business/{bid}      Business orders
```

### User Bookings
```
GET    /api/v1/bookings/user/my-bookings              All bookings
GET    /api/v1/bookings/user/my-bookings/count        Count by status
GET    /api/v1/bookings/user/my-bookings/upcoming     Upcoming only
GET    /api/v1/bookings/user/my-bookings/completed    Completed only
```

### Business Dashboard (Multi-store)
```
GET    /api/v1/bookings/business/today                Today's across all
GET    /api/v1/bookings/business/today/count          Count for today
GET    /api/v1/bookings/business/upcoming             Upcoming all
GET    /api/v1/bookings/business/pending-payment      Unpaid
```

### Business Management (Single Store)
```
GET    /api/v1/bookings/business/{bid}/bookings                List all
GET    /api/v1/bookings/business/{bid}/today                   Today only
GET    /api/v1/bookings/business/{bid}/bookings/count          Count stats
PUT    /api/v1/bookings/business/{bid}/booking/{oid}/confirm   Confirm
PUT    /api/v1/bookings/business/{bid}/booking/{oid}/mark-completed  Complete
PUT    /api/v1/bookings/business/{bid}/booking/{oid}/cancel    Cancel
```

---

## 💻 Quick API Examples

### Create a Booking
```bash
curl -X POST http://localhost:8000/api/v1/orders/ \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "service_id": "507f1f77bcf86cd799439011",
    "business_id": "507f1f77bcf86cd799439012",
    "amount": 2500,
    "metadata": {
      "from_time": "10:00",
      "to_time": "14:00",
      "num_people": 4
    }
  }'
```

### Get My Bookings
```bash
curl -X GET "http://localhost:8000/api/v1/bookings/user/my-bookings" \
  -H "Authorization: Bearer TOKEN"
```

### Get Today's Business Bookings
```bash
curl -X GET "http://localhost:8000/api/v1/bookings/business/today" \
  -H "Authorization: Bearer TOKEN"
```

### Confirm a Booking
```bash
curl -X PUT "http://localhost:8000/api/v1/bookings/business/BID/booking/OID/confirm" \
  -H "Authorization: Bearer TOKEN"
```

---

## 📊 Data Models

### Order/Booking Object
```json
{
  "id": "ObjectId string",
  "service_id": "ObjectId string",
  "business_id": "ObjectId string",
  "user_id": "ObjectId string",
  "payment_status": "pending|completed|failed|refunded",
  "order_status": "created|confirmed|in_progress|completed|cancelled",
  "amount": 2500.00,
  "metadata": {
    "from_time": "10:00",
    "to_time": "14:00",
    "quantity": 2,
    "custom_field": "any value"
  },
  "created_at": "2025-12-04T10:30:00",
  "updated_at": "2025-12-04T10:30:00"
}
```

### Count Response
```json
{
  "total": 15,
  "pending": 2,
  "confirmed": 5,
  "in_progress": 3,
  "completed": 4,
  "cancelled": 1
}
```

---

## 🔐 Authentication & Authorization

**All endpoints require JWT authentication:**
```
Authorization: Bearer <your_jwt_token>
```

**Ownership verification:**
- Users can only see their own bookings
- Business owners can only manage bookings for businesses they own
- Endpoints return 403 Forbidden if authorization fails

---

## 🔍 Key Features

| Feature | Details |
|---------|---------|
| **Status Tracking** | Order & Payment status with easy filtering |
| **Flexible Metadata** | Store custom data like times, quantities, notes |
| **Multi-Business Support** | Businesses can own multiple stores/locations |
| **Today's View** | Quick access to today's bookings (across all or specific) |
| **Pending Payments** | Easy tracking of unpaid bookings |
| **Upcoming View** | Non-completed bookings at a glance |
| **Batch Statistics** | Get counts by status in one call |
| **Pagination** | All list endpoints support skip/limit |
| **Filtering** | Filter by status, payment status, etc. |
| **Timestamps** | Automatic created_at/updated_at tracking |

---

## 🗄️ Database

### Collection: orders
Stores all bookings/orders with references to:
- `service_id` → services collection
- `business_id` → business collection
- `user_id` → users collection (from JWT)

### Collection: user_business (existing)
Used to determine business ownership:
- Query: `{uid: current_user_id, role: "owner"}`
- Gets all `bid` values (business IDs)

### Recommended Indexes
```javascript
db.orders.createIndex({ user_id: 1, created_at: -1 })
db.orders.createIndex({ business_id: 1, created_at: -1 })
db.orders.createIndex({ business_id: 1, order_status: 1 })
db.orders.createIndex({ payment_status: 1 })
db.orders.createIndex({ order_status: 1 })
db.user_business.createIndex({ uid: 1, role: 1 })
```

---

## ⚙️ Service Methods

### Core CRUD
- `create()` - Insert new order
- `get_by_id()` - Retrieve single order
- `get_all()` - List with filters
- `update()` - Modify order
- `delete()` - Remove order

### User Methods
- `get_by_user()` - User's orders
- `get_user_bookings_count()` - Status counts
- `get_user_upcoming_bookings()` - Not completed
- `get_user_completed_bookings()` - Completed only

### Business Methods
- `get_by_business()` - Single business orders
- `get_business_bookings()` - With filters
- `get_business_todays_bookings()` - Today only
- `get_business_bookings_count()` - Statistics
- `verify_business_ownership()` - Owner check

### Multi-Business Methods
- `get_todays_bookings_for_user_businesses()` - Today across all
- `get_todays_bookings_count_for_user_businesses()` - Today stats
- `get_upcoming_bookings_for_user_businesses()` - Upcoming across all
- `get_pending_payment_bookings_for_user_businesses()` - Unpaid across all

---

## 🚀 Getting Started

1. **Start server:**
   ```bash
   cd /Users/meheer/Github/Tourist/be
   python -m uvicorn app.main:app --reload
   ```

2. **View API docs:**
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

3. **Test endpoints:**
   - Create an order
   - Get bookings as user
   - Get today's bookings as business
   - Confirm/complete a booking

---

## 📚 Documentation Files

- `ORDERS_API.md` - Complete Orders endpoint documentation
- `BOOKINGS_API.md` - Complete Bookings endpoint documentation
- `IMPLEMENTATION_SUMMARY.md` - Full implementation details

---

## 🎓 Common Workflows

### User Books a Service
1. User views services via `/services` endpoint
2. User creates order via `POST /orders/`
3. User views booking via `GET /bookings/user/my-bookings`
4. Business confirms booking via `PUT /bookings/business/{bid}/booking/{oid}/confirm`
5. Business marks completed via `PUT /bookings/business/{bid}/booking/{oid}/mark-completed`

### Business Daily Operations
1. Business owner opens dashboard
2. Views today's bookings: `GET /bookings/business/today`
3. Reviews pending payments: `GET /bookings/business/pending-payment`
4. Confirms each booking as orders arrive
5. Marks complete when service finished
6. Checks daily stats: `GET /bookings/business/today/count`

### Analytics
1. Get user booking history: `GET /bookings/user/my-bookings/completed`
2. Get business performance: `GET /bookings/business/{bid}/bookings/count`
3. Track payment completion: Check `payment_completed` in count response

---

## ❌ Error Codes

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request (invalid data) |
| 403 | Forbidden (authorization failed) |
| 404 | Not found |
| 500 | Server error |

---

## 🔄 Status Values Reference

**Order Status:**
- `created` - Just created, awaiting action
- `confirmed` - Business confirmed the booking
- `in_progress` - Service is being delivered
- `completed` - Service completed
- `cancelled` - Cancelled by user or business

**Payment Status:**
- `pending` - Payment awaited
- `completed` - Payment received
- `failed` - Payment transaction failed
- `refunded` - Payment returned to customer

---

## 📝 Notes

- All timestamps are in ISO 8601 format
- All IDs are MongoDB ObjectId strings
- Metadata field accepts any JSON object
- Pagination defaults: skip=0, limit=10
- All endpoints require authentication
- Business endpoints verify ownership
- Today's bookings use server date
