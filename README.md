# Thrift Delivery Management System

A delivery management application for thrift-store owners to manage riders and track deliveries.

## Features

- User authentication (Manager & Rider roles)
- Delivery management and tracking
- Rider assignment system
- Queue management for orders
- Real-time delivery status updates

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables (if needed)

3. Start the development server:
   ```bash
   npm run dev
   ```

4. For production:
   ```bash
   npm start
   ```

## Project Structure

```
thriftdelivery/
├── app.js                         # Main server file
├── routes/                        # Route handlers
├── controllers/                   # Business logic
├── models/                        # Data access layer
├── views/                        # EJS templates
├── public/                       # Static files
├── middleware/                   # Custom middleware
└── utils/                       # Helper functions
```

## Technologies Used

- Node.js
- Express.js
- EJS Templates
- Express Sessions
- TailwindCSS
- Local JSON Storage