# KATANA PARFUM

A lightweight perfume shop for Morocco. The storefront and product catalog are served by Express/Vercel Functions. The catalog is a project JSON file; customer accounts and MongoDB are not used.

## Run locally

1. Install Node.js 18+ and run `npm install`.
2. Copy `.env.example` to `.env`.
3. Set `JWT_SECRET` to a long random secret, and set your private `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
4. Run `npm start` and open `http://localhost:3000`.

The admin login is at `/admin/login.html`. The administrator credentials are read on the server from environment variables. Do not put an admin password in HTML, browser JavaScript, or a public repository.

## Products and orders

Edit `server/data/products.json` to add or change products, then deploy the project. The admin dashboard displays the catalog but cannot save product changes because Vercel's serverless filesystem is not persistent.

Customers do not need an account. Checkout requires their name, phone number, city, and delivery address, and opens WhatsApp with the order details. Delivery instructions or a preferred delivery time are optional. The customer must send the prepared WhatsApp message to confirm the order. The site does not store orders or provide order history.

The WhatsApp business number is configured in `client/checkout.html`, `server/app.js`, and the storefront links. Update all three values if the business number changes.

## Deploy to Vercel for free

Connect the repository to Vercel with the project root as the Root Directory. Add these environment variables in **Project Settings → Environment Variables**:

- `ADMIN_EMAIL`: your administrator Gmail address.
- `ADMIN_PASSWORD`: a strong, private administrator password.
- `JWT_SECRET`: a separate long, random secret used to sign admin sessions.

Do not commit the real values. Redeploy after setting or changing environment variables. No MongoDB account or connection string is required.

After deployment, check `/api/products` for the product catalog, then sign in at `/admin/login.html`. API responses and deployment function logs are available in the Vercel project dashboard.
