# KATANA PARFUM

A lightweight perfume shop for Morocco. Customer accounts and MongoDB are not used. Products live in a project JSON file, while order records are stored in Google Sheets.

## Run locally

1. Install Node.js 18+ and run `npm install`.
2. Copy `.env.example` to `.env`.
3. Set a private `ADMIN_EMAIL`, an `ADMIN_PASSWORD` of at least 12 characters, and a random `JWT_SECRET` of at least 32 characters.
4. Configure the Google Sheets web app below.
5. Run `npm start` and open `http://localhost:3000`.

The admin login is at `/admin/login.html`. Keep all credentials in server environment variables; never place an administrator password or Google API key in browser JavaScript or commit real values to Git.

## Free Google Sheets order storage

1. The orders spreadsheet is [this Google Sheet](https://docs.google.com/spreadsheets/d/1Fb9dd9Wn8Igy1KScpMMKzZ5UwOwk_yJK6v-_9YwqOJQ/edit). Its ID is already configured as the default in the Apps Script file.
2. At [script.google.com](https://script.google.com), create a project and replace its `Code.gs` with `google-apps-script/Code.gs`.
3. In **Project Settings → Script Properties**, add:
   - `API_KEY`: a long random secret. Use the same value as `GOOGLE_SHEETS_KEY`.
4. Choose **Deploy → New deployment → Web app**. Set **Execute as** to yourself and **Who has access** to **Anyone**, then deploy and authorize the requested spreadsheet access. The API key in the server request protects the web app actions. Copy its `/exec` URL.
5. Add these environment variables to Vercel:
   - `ADMIN_EMAIL`: your administrator Gmail.
   - `ADMIN_PASSWORD`: a strong private password (12+ characters).
   - `JWT_SECRET`: a separate long random secret (32+ characters).
   - `GOOGLE_SHEETS_KEY`: the same secret as Apps Script's `API_KEY`.
   Select **Production** for the public store; also select **Preview** only if testing a protected preview deployment.
6. Redeploy Vercel after setting or changing environment variables. Submit a test order and verify that it appears in the spreadsheet and at `/admin/dashboard.html`.

Orders include the customer's name, phone, city, delivery address, products, total, status, and optional delivery note. Admins can update an order's status in the dashboard. Customers can submit without an account; checkout saves the order first and then opens WhatsApp with the order details.

Google Apps Script and Google Sheets have usage quotas and require a Google account. This is free for modest order volume, not guaranteed unlimited.
Keep the spreadsheet private to your administrator account; do not enable public spreadsheet sharing.

## Products and WhatsApp

Edit `server/data/products.json` to add or change products, then deploy the project. Vercel's serverless filesystem is not persistent, so the admin dashboard displays products but product changes must be committed and redeployed.

The WhatsApp business number is configured in `client/checkout.html`, `server/app.js`, and the storefront links. Update those values if the business number changes.

## Vercel deployment

Connect the repository to Vercel with the project root (the directory containing `vercel.json` and `package.json`) as its Root Directory. Configure the environment variables above in **Project Settings → Environment Variables** and redeploy after changes. No MongoDB account or connection string is needed.
