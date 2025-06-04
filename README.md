# User Management Backend

A Node.js Express server with Supabase PostgreSQL database integration for user authentication and management.

## Features

- 🚀 Express.js REST API
- 🐘 Supabase PostgreSQL database integration
- 🔒 JWT-based authentication
- 👥 User registration and login
- 🔐 Password hashing with bcrypt
- 🛡️ Security middleware (Helmet, CORS)
- ✅ Input validation and error handling
- 📄 Pagination and search functionality
- 🔄 Modular route structure
- 🌱 Environment-based configuration

## Prerequisites

- Node.js (v18 or higher)
- Supabase account and project
- npm or yarn package manager

## Quick Start

1. **Clone or navigate to the project directory**

   ```bash
   cd farm_link_backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Run the setup script (optional)**

   ```bash
   npm run setup
   ```

4. **Configure Environment Variables**

   - Update the `.env` file with your Supabase credentials: ```env
     SUPABASE_URL=https://your-project-id.supabase.co
     SUPABASE_ANON_KEY=your-supabase-anon-key
     SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
     JWT_SECRET=your-super-secret-jwt-key-here
     PORT=3000
     NODE_ENV=development

   ```

   ```

5. **Database Setup**

   - Open your Supabase project dashboard
   - Go to the SQL Editor
   - Copy and execute the SQL commands from `database/schema.sql`

6. **Start the server**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3000`.

## Usage

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The server will start on `http://localhost:3000` (or your specified PORT).

## API Endpoints

### Health Check

- `GET /health` - Server health status
- `GET /api/test-db` - Database connection test

### Authentication

- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login user

### Users Management

- `GET /api/users` - Get all users (with pagination and search)
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/role/:role` - Get users by role
- `POST /api/users` - Create new user (without authentication)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Query Parameters for GET /api/users

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)
- `search` - Search term for name, email, or location
- `role` - Filter by role (admin, farmer, customer, support)

## Request/Response Examples

### Register User

```bash
POST /api/users/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "role": "customer",
  "name": "John Doe",
  "phone": "+1-555-0123",
  "location": "San Francisco, CA"
}
```

### Login User

```bash
POST /api/users/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Authentication Response

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "user@example.com",
      "name": "John Doe",
      "phone": "+1-555-0123",
      "location": "San Francisco, CA",
      "role": "customer",
    },
    "token": "jwt-token-here"
  }
}
```

### Get All Users

```bash
GET /api/users?page=1&limit=10&role=customer
```

### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-here",
      "email": "user@example.com",
      "name": "John Doe",
      "phone": "+1-555-0123",
      "location": "San Francisco, CA",
      "role": "customer",
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

## Database Schema

The simplified database schema includes:

- **users** - User accounts with authentication (email, password, name, role, etc.)

See `database/schema.sql` for the complete schema definition.

## Project Structure

```
user_management_backend/
├── config/
│   └── database.js          # Supabase client configuration
├── database/
│   └── schema.sql           # Database schema and sample data
├── middleware/
│   └── validation.js        # Validation and utility middleware
├── routes/
│   └── users.js            # User-related routes and authentication
├── .env                    # Environment variables (created from .env.example)
├── .env.example            # Example environment configuration
├── .gitignore             # Git ignore rules
├── index.js               # Main application file
├── package.json           # Dependencies and scripts
├── setup.js               # Setup script for initial configuration
├── Farm_Link_API.postman_collection.json  # Postman collection for API testing
└── README.md              # This file
```

## Environment Variables

| Variable                    | Description               | Required                  |
| --------------------------- | ------------------------- | ------------------------- |
| `SUPABASE_URL`              | Your Supabase project URL | Yes                       |
| `SUPABASE_ANON_KEY`         | Supabase anonymous key    | Yes                       |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Optional                  |
| `JWT_SECRET`                | Secret key for JWT tokens | Yes                       |
| `PORT`                      | Server port               | No (default: 3000)        |
| `NODE_ENV`                  | Environment mode          | No (default: development) |

## Getting Supabase Credentials

1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project
3. Go to Settings > API
4. Copy the Project URL and anon/public key
5. For the service role key, copy the service_role key (use with caution)

## Security Features

- **Helmet.js** - Sets security headers
- **CORS** - Cross-origin resource sharing configuration
- **Input Validation** - Request data validation
- **Rate Limiting** - Basic rate limiting implementation
- **Error Handling** - Comprehensive error handling

## Development Tips

1. **Testing Database Connection**

   - Visit `http://localhost:3000/api/test-db` to verify database connectivity

2. **Adding New Routes**

   - Create route files in the `routes/` directory
   - Import and use them in `index.js`

3. **Environment Specific Configuration**

   - Use different `.env` files for different environments
   - Never commit sensitive credentials to version control

4. **Database Migrations**
   - Use Supabase's migration tools for schema changes
   - Keep track of schema changes in version control

## Troubleshooting

### Common Issues

1. **Database Connection Failed**

   - Verify your Supabase URL and keys in `.env`
   - Check if your Supabase project is active
   - Ensure your IP is allowed in Supabase (if restrictions are enabled)

2. **CORS Errors**

   - The server includes CORS middleware for all origins in development
   - Adjust CORS settings in `index.js` for production

3. **Port Already in Use**
   - Change the PORT in your `.env` file
   - Kill the process using the port: `netstat -ano | findstr :3000`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

ISC License - see package.json for details.

## Support

For issues and questions:

1. Check the troubleshooting section
2. Review Supabase documentation
3. Create an issue in the project repository
