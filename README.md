# KATANA PARFUM

Production-oriented luxury perfume store for Morocco. The application uses HTML5, CSS3, Vanilla JavaScript, Node.js, Express, MongoDB/Mongoose, JWT, bcrypt, Cloudinary and Nodemailer.

## Run locally

1. Install Node.js 18+ and Docker Desktop.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and set `MONGODB_URI` and a strong `JWT_SECRET`.
4. Run `npm run db:start` to start MongoDB with persistent Docker storage.
5. Run `npm run seed` to add editable demo products and site settings.
6. Run `npm run create-admin` and follow the prompts to create an admin safely.
7. Run `npm start`, then open `http://localhost:3000`.

MongoDB uses `mongodb://127.0.0.1:27017/katana-parfum` by default. Check `/health` to confirm that the API reports `database: connected`.

## Configuration

Contact details, delivery rules, currency, homepage copy and social links are stored in MongoDB under settings and can be changed through the admin API. Cloudinary and SMTP are optional in local development and are enabled by adding their environment variables.

## API

Public endpoints include `GET /api/products`, `GET /api/products/:id`, `GET /api/settings`, `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/orders`, `POST /api/contact`, and `POST /api/newsletter`. Admin endpoints are protected with JWT and the `admin` role under `/api/admin`.

## Deployment

Deploy the Node process to a VPS or Node hosting provider, use a managed MongoDB database, set all environment variables in the provider dashboard, configure Cloudinary and SMTP, point `katanaparfum.cam` to the host, and enforce HTTPS. Serve the same Express process behind a reverse proxy such as Nginx.

### Vercel

The Vercel deployment serves the same static pages and sends `/api/*` requests to the Express application in `api/[...path].js`. Configure these environment variables in the Vercel project before deploying:

- `MONGODB_URI`: a reachable MongoDB connection string (for example, MongoDB Atlas).
- `JWT_SECRET`: a unique, randomly generated secret with at least 32 characters.
- `CLIENT_URL`: the deployed site origin, such as `https://katanaparfum.vercel.app`.

Create the first administrator locally against that same database with `npm run create-admin`. Then redeploy the Vercel project. Admin sign-in is available at `/admin/login.html`; `/admin/dashboard.html` and its product-management actions require an account with the `admin` role. Check `/api/products` and `/api/auth/login` after deployment to confirm the API function is active. The products endpoint returns an empty list until the connected database contains products; add them from the admin dashboard or seed demo products locally against that database.

### Current LiteSpeed hosting

If the domain document root is the project root, upload `.htaccess`, `account.html`, `login.html`, `client/`, and `admin/`. The `.htaccess` file redirects root account/auth pages to the working `/client/` pages and maps root asset paths. Static pages will work immediately, but `/api/*` requires running `server/server.js` with Node.js, a reachable MongoDB database, and the variables in `.env`. On cPanel use **Setup Node.js App** and configure the domain as a reverse proxy to the Node app; do not expect LiteSpeed static hosting alone to execute Express or MongoDB code.

## Security and testing checklist

Use a long secret, HTTPS, managed MongoDB credentials, Cloudinary signed uploads, SMTP credentials outside Git, regular backups, rate limiting, Helmet, CORS allow-listing and server-side validation. Before release test registration, login, admin protection, search/filtering, cart, checkout, order status, wishlist persistence, contact, newsletter, image upload and mobile layouts.
