# SILICON HOUSE

A full-stack eCommerce backend and storefront for PC hardware — built with Node.js, Express, and MongoDB, with a vanilla HTML/CSS/JS frontend.

## About

SILICON HOUSE is a PC parts and components store. Shoppers can browse the catalog by category, view product details, manage a cart, and check out. Admins can create, edit, and delete products (with image uploads via Cloudinary), and manage order status across the store.

**Core resources:** Products, Carts, Orders, Users
**Auth:** JWT-based, with `shoppers` and `admins` roles

## Tech Used

- **Backend:** Node.js, Express
- **Database:** MongoDB with Mongoose
- **Auth:** JSON Web Tokens (JWT), bcrypt for password hashing
- **Image uploads:** Multer + Cloudinary
- **Frontend:** HTML, CSS, vanilla JavaScript (no framework)

## Install

```bash
git clone "https://github.com/OmarEbada327/eCommerce-Website-Project.git"
cd backend
npm install
```

Copy `.env.example` to `.env` and fill in your own values:

```bash
cp .env.example .env
```

```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=vad2jw7q
CLOUDINARY_API_KEY=694483939312723
CLOUDINARY_API_SECRET=fr2-QVdlehDEO0Rtwl76kMacQ7Q
```

## Run

Seed the database with sample products (run once, or any time you want fresh sample data):

```bash
npm run seed
```

Start the server:

```bash
npm run dev
```

The API will be running at `http://localhost:3000`.

To use the frontend, open `Frontend/index.html` in your browser (or serve it with a local static server). Make sure the backend is running first.

## API Testing

A Postman collection covering every route (Auth, Users, Products, Cart, Orders) is included in the `/postman` folder. Import it into Postman, set the `baseUrl` variable to your running server, and log in once — the auth token auto-saves for every other request.

## API Endpoints (Quick Reference)

### Authentication

| Method | Endpoint | Description | Auth Required? |
| :--- | :--- | :--- | :--- |
| **POST** | `/auth/register` | Register a new user account | No |
| **POST** | `/auth/login` | Log in and receive a JWT Bearer token | No |

### User Management

| Method | Endpoint | Description | Auth Required? |
| :--- | :--- | :--- | :--- |
| **GET** | `/users/profile` | Retrieve the authenticated user's profile details | Yes (User) |
| **PUT** | `/users/profile` | Update the authenticated user's profile info | Yes (User) |
| **DELETE** | `/users/:userId` | Permanently delete a specific user account | Yes (Admin Only) |

### Product Management

| Method | Endpoint | Description | Auth Required? |
| :--- | :--- | :--- | :--- |
| **GET** | `/products` | Get list of all products | No |
| **GET** | `/products/:productId` | Get details of a single product | No |
| **POST** | `/products` | Create a new product | Yes (Admin Only) |
| **PUT** | `/products/:productId` | Update a product's price or quantity | Yes (Admin Only) |
| **DELETE** | `/products/:productId` | Delete a product from the database | Yes (Admin Only) |

### Shopping Cart

| Method | Endpoint | Description | Auth Required? |
| :--- | :--- | :--- | :--- |
| **GET** | `/cart` | View items and quantities in your cart | Yes (User) |
| **POST** | `/cart` | Add a product and specify quantity to the cart | Yes (User) |
| **PUT** | `/cart` | Update item quantity in the cart | Yes (User) |
| **DELETE** | `/cart/:productId` | Remove a specific product from the cart | Yes (User) |
| **DELETE** | `/cart` | Clear all items from your cart | Yes (User) |

### Order Processing

| Method | Endpoint | Description | Auth Required? |
| :--- | :--- | :--- | :--- |
| **POST** | `/orders/checkout` | Convert cart items to an order | Yes (User) |
| **GET** | `/orders/mine` | Retrieve past order history for logged-in user | Yes (User) |
| **GET** | `/orders/:orderId` | Get detailed information for a specific order | Yes (User) |
| **PATCH** | `/orders/:orderId/status` | Update the status of a specific order | Yes (Admin Only) |
| **PATCH** | `/orders/:orderId/cancel` | Cancel an existing order | Yes (User) |

## Project Structure

```text
├── backend/
│   ├── config/          # DB and Cloudinary configurations
│   ├── controllers/     # Route handler functions
│   ├── middleware/      # Authentication & Validation middlewares
│   ├── models/          # Mongoose Schemas (Product, User, etc.)
│   ├── routes/          # Express route definitions
│   └── server.js        # Entry point
├── frontend/            # Vanilla HTML/CSS/JS files
└── postman/             # Postman Collection JSON
```

## Important Notes for Testing in Postman

### 1. Handling Authentication (JWT Token)

- **Automatic Way (Recommended):** If you are using our provided Postman Collection, logging in will automatically capture and save your auth token to the `token` variable. You don't need to do anything!
- **Manual Way:** If the automatic script doesn't run, copy the `token` from the login JSON response, go to your Postman Environment/Collection Variables, and paste it into the `token` variable.

### 2. Uploading Products (Admin Only)

- In the request builder for **`Add product (admin only)`**, go to the **Headers** tab.
- Click the **`...`** (More Actions) button next to **Bulk Edit**.
- Ensure **Content-Type** is selected/added, and set its value to `image/jpeg` if you are sending raw image data.
  
  ### 3. Admin Access & Role Security

- **Default Role:** For security and realism, all new users registered through the frontend or the `/auth/register` API are assigned the **`shopper`** role by default.
- **Promoting a User to Admin:** To make a user an administrator, you must update their role directly in the MongoDB database:
  1. Open your database using **MongoDB Atlas** or **MongoDB Compass**.
  2. Locate the user's document in the `users` collection.
  3. Edit the `role` field from `"shoppers"` to `"admins"`.
  4. Save the document. The user will now have admin clearance on their next request/login.
