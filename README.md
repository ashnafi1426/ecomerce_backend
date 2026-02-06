# E-Commerce Backend - Production Ready

## Overview
Production-ready Node.js + Express backend for a D2C e-commerce platform with **Supabase only**, featuring security middleware, rate limiting, and clean architecture.

## Features

### Security
- ✅ Helmet.js for HTTP security headers
- ✅ CORS configuration with whitelisted origins
- ✅ Rate limiting to prevent abuse
- ✅ Request body size limits
- ✅ Compression for response optimization

### Architecture
- ✅ Clean separation of concerns
- ✅ Centralized error handling
- ✅ Environment-based configuration
- ✅ API versioning (/api/v1)
- ✅ Graceful shutdown handling
- ✅ Supabase connection management

### Monitoring
- ✅ Health check endpoints
- ✅ Request logging (Morgan)
- ✅ Error logging
- ✅ Uptime tracking

## Prerequisites

- Node.js >= 16.x
- Supabase account
- npm or yarn

## Installation

### 1. Install Dependencies

```bash
cd ecomerce_backend
npm install
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```env
# Required
NODE_ENV=development
PORT=5000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-super-secret-jwt-key-min-32-characters

# Optional
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
STRIPE_SECRET_KEY=sk_test_your_key
```

### 3. Database Setup

Go to your Supabase dashboard:
1. Run the SQL script from `../database-design/supabase-setup.sql`
2. Copy your project URL and service role key to `.env`

## Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

## API Endpoints

### Health Check
```bash
GET /api/v1/health
```

Response:
```json
{
  "status": "success",
  "message": "Server is running",
  "data": {
    "environment": "development",
    "timestamp": "2026-02-06T10:30:00.000Z",
    "uptime": 123.456,
    "version": "1.0.0"
  }
}
```

### Business Routes
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get user profile (protected)
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/orders` - Create order (protected)
- `GET /api/orders/my` - Get user orders (protected)
- `GET /api/admin/*` - Admin routes (protected + admin role)

## Project Structure

```
ecomerce_backend/
├── config/
│   ├── env.config.js          # Environment configuration
│   ├── supabase.js            # Supabase client (ONLY DB connection)
│   ├── jwt.js                 # JWT configuration
│   └── stripe.js              # Stripe configuration
│
├── routes/
│   ├── index.js               # Central router
│   ├── authRoutes/
│   ├── productRoutes/
│   ├── orderRoutes/
│   └── adminRoutes/
│
├── controllers/               # Request handlers
├── services/                  # Business logic (uses Supabase)
├── middlewares/               # Express middlewares
├── utils/                     # Utility functions
├── app.js                     # Express app setup
├── server.js                  # Server entry point
└── package.json               # Dependencies
```

## Security Features

### 1. Helmet.js
Sets various HTTP headers for security

### 2. Rate Limiting
- 100 requests per 15 minutes per IP
- Applies to all `/api/*` routes

### 3. CORS
- Whitelisted origins only
- Credentials support

### 4. Request Size Limits
- JSON body: 10MB max

## Environment Variables

### Required
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `JWT_SECRET` - JWT signing secret (min 32 chars)

### Optional
- `CORS_ORIGINS` - Comma-separated allowed origins
- `RATE_LIMIT_WINDOW_MS` - Rate limit window
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window
- `STRIPE_SECRET_KEY` - Stripe secret key

## Testing

### Health Check
```bash
curl http://localhost:5000/api/v1/health
```

### Connection Test
```bash
node test-connection.js
```

## Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Use strong `JWT_SECRET` (min 32 characters)
3. Configure production Supabase project
4. Set production `CORS_ORIGINS`

### Recommended Platforms
- **Render** - Easy deployment
- **Railway** - Simple setup
- **Vercel** - Serverless option
- **Heroku** - Classic PaaS

## Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <process_id> /F
```

### Database Connection Failed
- Check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Verify Supabase project is active
- Check network connectivity

## License

This project is for educational purposes.

---

**Version**: 1.0.0  
**Database**: Supabase Only  
**Status**: Production Ready ✅
