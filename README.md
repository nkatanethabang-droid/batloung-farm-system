# Batloung Farm Distribution Management System

A responsive Node.js, Express and MySQL application for the DIWA2110 Web Application Development take-home test. The visual direction follows the supplied fresh-produce template (deep green, gold accents, fruit-led hero, clean product-style sections), while the workflow is designed for farm administration rather than online consumer shopping.

## Features
- Supplier registration, listing, search-by-ID, update and delete API; supported provinces are the eight named in the brief.
- Fruit registration and availability status; each new fruit automatically receives small, medium and large stock rows plus editable starting prices.
- Stock balances keyed by **fruit + packaging size**, with separate small, medium and large quantities.
- Editable selling prices for each fruit and package size.
- Vendor registration, listing, search by name/phone, update and delete API.
- Separate administrator and vendor sign-in, password hashing, signed login sessions, and role-protected API routes.
- Vendors can view only their own sales, Sale IDs, payment status and outstanding balances. Administrators manage the full farm workspace.
- Vendor accounts are created when registering a new vendor, or separately for an existing vendor from the Vendors page.
- Multi-item purchases; purchase totals are calculated on the server and stock increases within a MySQL transaction.
- Multi-item sales; totals and selling prices are taken from the database, repeated fruit/size lines are combined for stock checks, stock is locked and validated, and the complete sale rolls back if any item is unavailable.
- Cash, mobile-money and credit payment methods; PAID, PARTIALLY_PAID and UNPAID statuses; payment history and outstanding vendor balances.
- Dashboard and the four required SQL reports.
- JSON validation, HTTP status codes and central error handling. The server remains available if MySQL is temporarily unreachable and reports a useful API error rather than crashing.

## Requirements
- Node.js 18+
- MySQL 8.0.16+ (for enforced CHECK constraints)

## Setup (Windows / VS Code)
1. Extract the ZIP folder.
2. Open the extracted `BatloungFarm` folder in VS Code.
3. Open a terminal in that folder and run `npm install`.
4. Create the database by importing `database/schema.sql` in MySQL Workbench or running:
   ```bash
   mysql -u root -p < database/schema.sql
   ```
5. Create or update the login accounts table (this also expands the password hash column for existing databases):
   ```bash
   mysql -u root -p < database/auth.sql
   ```
6. Optional: load demonstration suppliers, vendors and opening stock:
   ```bash
   mysql -u root -p < database/demo_seed.sql
   ```
7. Copy `.env.example` to a new file named `.env`. Enter your own MySQL username and password. Change `AUTH_SECRET` to a long random value and set a strong `ADMIN_PASSWORD`. Never upload `.env` to GitHub. The ZIP intentionally does not include a real `.env` file or passwords.
8. Create the administrator account (run once, and again only if you intentionally want to reset its password):
   ```bash
   node scripts_create_admin.js
   ```
9. Start the application:
   ```bash
   npm start
   ```
10. Open `http://localhost:3000` in a browser and sign in as Administrator.

## Environment variables
`PORT`, database settings, `NODE_ENV`, `LOW_STOCK_THRESHOLD`, `AUTH_SECRET`, `ADMIN_USERNAME` and `ADMIN_PASSWORD` are read from `.env`.

## Login accounts
- **Administrator:** created with `node scripts_create_admin.js` using `ADMIN_USERNAME` and `ADMIN_PASSWORD` from `.env`.
- **New vendor:** enter a username and temporary password (minimum 10 characters) when registering the vendor in the Vendors page.
- **Existing vendor:** use “Create login for an existing vendor” on the Vendors page.
- Vendors sign in using the Vendor account type and can view their own sales only. The administrator signs in using Administrator and can manage the full system.
- Passwords are stored as salted scrypt hashes, not plain text. Sessions expire after eight hours.

## Main API endpoints
All endpoints return JSON. The frontend is served at `/`.

| Method | Endpoint | Purpose |
|---|---|---|
| GET/POST | `/api/suppliers` | List / register suppliers |
| GET/PUT/DELETE | `/api/suppliers/:id` | Read / update / delete supplier |
| GET/POST | `/api/fruits` | List / register fruit types |
| GET/PUT/DELETE | `/api/fruits/:id` | Read / update / delete fruit |
| GET/POST | `/api/vendors` | List / register vendors |
| GET/PUT/DELETE | `/api/vendors/:id` | Read / update / delete vendor |
| GET | `/api/vendors?search=...` | Search vendor by name or phone |
| GET | `/api/stock` | Stock by fruit and packaging size |
| GET | `/api/stock/low?threshold=10` | Low-stock items |
| GET | `/api/prices` | Selling price list |
| PUT | `/api/prices` | Create/update price `{fruit_id, packaging_size, selling_price}` |
| POST | `/api/purchases` | Record multi-item purchase |
| POST | `/api/sales` | Record multi-item sale |
| POST | `/api/sales/:saleId/payments` | Record a later payment |
| POST | `/api/auth/login` | Sign in as admin or vendor |
| GET | `/api/auth/me` | Current signed-in account |
| GET | `/api/vendor/my-sales` | Vendor’s own sale history |
| GET | `/api/dashboard` | Dashboard totals (admin only) |
| GET | `/api/reports?from=YYYY-MM-DD&to=YYYY-MM-DD` | Four reports and vendor balances |
| GET | `/api/health` | Server health check |

### Example purchase request
```json
{
  "supplier_id": 1,
  "purchase_date": "2026-11-17",
  "items": [
    {"fruit_id": 1, "packaging_size": "small", "quantity": 20, "unit_cost": 45.00},
    {"fruit_id": 2, "packaging_size": "large", "quantity": 8, "unit_cost": 120.00}
  ]
}
```

### Example sale request
```json
{
  "vendor_id": 1,
  "sale_date": "2026-11-17",
  "payment_method": "MOBILE_MONEY",
  "amount_paid": 500,
  "items": [
    {"fruit_id": 1, "packaging_size": "small", "quantity": 3, "unit_price": 85.00},
    {"fruit_id": 2, "packaging_size": "medium", "quantity": 2, "unit_price": 150.00}
  ]
}
```

The server calculates the amount due; clients do not submit a total. `amount_paid` may be zero for credit. A later payment uses `/api/sales/:saleId/payments`.

## Database design notes
The authentication migration adds a `users` table linked to vendor records. The eight required relational tables are `suppliers`, `fruits`, `vendors`, `purchases`, `purchase_details`, `sales`, `sales_details`, and `stock`. Two supporting tables are added: `packaging_prices` holds a distinct current selling price for each fruit/size combination, and `vendor_payments` keeps a payment history. `stock` has a unique key on `(fruit_id, packaging_size)`, so each pack size has its own balance.

## Demonstration checklist for your recorded video
1. Open the dashboard and explain the totals and low-stock view.
2. Register a supplier and a vendor.
3. Show the five fruit types and small/medium/large stock rows.
4. Set different prices for one fruit's three package sizes.
5. Record one purchase containing at least two fruit items and show stock increasing.
6. Record a sale containing multiple fruit items and show stock decreasing and the automatic total.
7. Try selling more boxes than are available. Explain that the API responds with HTTP 400 and rolls back the entire sale; no item is deducted.
8. Demonstrate a cash or mobile-money payment, a credit sale, and a later partial payment. Show the outstanding balance and payment status.
9. Run the reports for a date range and show the top five fruits, revenue, highest-volume vendor, stock and balances.

## Submission reminders
The assessment requires a live link, GitHub repository link and recorded demonstration video. This ZIP contains the source project and database scripts; it does not automatically deploy the app or create those external submission links. Deploy the Node app and MySQL database to hosting that supports both, set environment variables in the host dashboard, and keep `.env` private.


## Access to the website

This coursework version opens directly without a login screen. Administrators and vendors can open the same website and use its sections without usernames or passwords. Vendor registration records the vendor's name, phone number and location only. Because no login is required, all visitors have access to management functions; use this open-access setup for the assignment demonstration only, not for a live business system handling private information.

## Administrator-only sign-in, themes, languages and receipts

- The website now starts at an administrator sign-in screen. Vendor accounts are not offered a login option.
- Run `database/auth.sql` once against the `batloung_farm` database to create/upgrade the users table.
- Set `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `.env` (password must be at least 10 characters), then run `node scripts_create_admin.js` to create the administrator account.
- Sign in using that administrator username and password. All application API routes require a valid administrator token.
- Use the top-right theme control to switch between light and dark mode. The selection is saved in the browser.
- The language selector offers English, French, Spanish, Portuguese, Arabic, Chinese, Hindi and Swahili. The language can be changed on either the login screen or inside the dashboard. Main interface labels, headings, common form labels, buttons, helper text, common table labels and supported dynamically added messages use the selected language. Business data entered by users (such as supplier, fruit and vendor names) remains unchanged.
- Completing a vendor sale opens the browser print dialog with an itemised sale receipt and a unique `SALE-########` receipt number. Recording each later vendor payment opens a separate payment receipt with its own unique `PAY-########` number, the amount received in that payment, total paid to date and remaining balance. Receipt numbers are based on the saved database transaction IDs, so each transaction can be traced. Select a printer or choose “Save as PDF” in the browser print dialog. The sale receipt uses item descriptions and prices returned by the server/database, not values trusted from the browser.

## Login and language improvements
- The login screen and the dashboard are mutually exclusive; the `hidden` attribute is enforced in CSS so the login card cannot remain layered over the workspace.
- On page refresh, the saved administrator token is validated through `/api/auth/me` before the dashboard is shown. Expired or invalid sessions return to the login screen.
- The language selection is available before login and in the workspace, is synchronised between both selectors, and is saved in the browser.


## OpenStreetMap vendor location picker
- Vendor registration uses Leaflet with OpenStreetMap map tiles. A user enters a search term and presses **Search** (the public Nominatim service does not permit autocomplete); they can select a result or click/drag the marker on the map.
- Search/reverse-geocoding is handled by the server using Nominatim. The selected address, available street/area/town components, OSM reference, latitude and longitude are stored in the existing vendor fields. The `place_id` column stores an `osm:<type>:<id>` reference for OpenStreetMap results; it is not a Google Place ID.
- Driving and walking routes are calculated by the FOSSGIS OSRM profiles hosted at `routing.openstreetmap.de`. Gold shows driving; green dashed shows walking. Distance is formatted as km or m and duration as hours/minutes.
- Route origin is Limkokwing University of Creative Technology, Moshoeshoe Road, Maseru Central, Maseru, Lesotho. The current map pin is approximate (latitude -29.3060385, longitude 27.4870795); verify the pin visually and adjust `FARM_ORIGIN` in `src/routes/maps.js` if the farm dispatch point should be elsewhere on campus.
- No Google Maps API keys, Google Cloud project or Google billing configuration is required. The public OpenStreetMap/FOSSGIS endpoints are shared community services intended for light use, not guaranteed production infrastructure. Nominatim requests are throttled to at most one per second and are only sent after a user presses Search or selects a map point; the application displays OpenStreetMap attribution. For a larger/live commercial deployment, use a contracted geocoding/routing provider or host the services yourself and update the endpoint configuration. See the [Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/) and [FOSSGIS routing service information](https://routing.openstreetmap.de/about.html).
- Existing database: no new migration is required if the earlier vendor location migration has already added `latitude`, `longitude`, `place_id`, `street`, `area` and `town`. New database: import `database/schema.sql`, which already includes these fields.
