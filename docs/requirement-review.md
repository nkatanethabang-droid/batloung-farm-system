# DIWA2110 assignment comparison and corrections

Reviewed against `DIWA2110 Take Home Test` (42 marks).

## Part A — MySQL database (10 marks)
- [x] All eight required tables are present: suppliers, fruits, vendors, purchases, purchase_details, sales, sales_details and stock.
- [x] Primary keys, foreign keys, unique rules, NOT NULL rules and quantity/amount checks are defined.
- [x] Stock is stored separately by fruit and packaging size (small, medium, large).
- [x] The five required fruits and initial stock/price rows are inserted by `database/schema.sql`.
- [x] Supporting tables store package selling prices and vendor payment history.
- [ ] Import the SQL scripts into the student's own MySQL server and confirm the data is present.

## Part B — Node.js backend (8 marks)
- [x] Express and mysql2 are used.
- [x] Code is separated into configuration, routes, controllers, services, middleware and authentication folders.
- [x] Database settings are read from `.env`; `.env.example` is supplied instead of sharing real credentials.
- [x] Database operations use async/await and try/catch.
- [x] The server stays running if MySQL is unavailable and the health endpoint remains available.
- [ ] Set the student's own database credentials and test the connection locally.

## Part C — Express REST API (14 marks)
- [x] Supplier create, list, read, update and delete endpoints.
- [x] Fruit create, list, read, update and delete endpoints; available fruit filtering.
- [x] Stock list and low-stock endpoints.
- [x] Vendor create, list, read, update, delete and search endpoints.
- [x] Purchase endpoint supports multiple fruit lines, calculates totals and increases stock.
- [x] Sales endpoint supports multiple fruit lines, calculates totals from database selling prices, validates stock and decreases stock.
- [x] Validation and central HTTP error responses are implemented.
- [ ] Test every endpoint against the student's live MySQL database.

## Part D — Business logic and transactions (10 marks)
- [x] Purchase and sales totals are calculated by the server.
- [x] Stock is updated within transactions and cannot be reduced below available quantity.
- [x] Repeated lines for the same fruit and package size are combined before checking stock.
- [x] A sale is rolled back fully if any requested item is unavailable.
- [x] Four reports are available: top five fruits, sales revenue by date range, highest-volume vendor and stock by package size.
- [x] Cash, mobile money and credit payment methods are supported.
- [x] PAID, PARTIALLY_PAID and UNPAID statuses and outstanding balances are calculated.
- [ ] Demonstrate a failed multi-item sale and a successful payment workflow in the recorded video.

## Corrections made in this review
1. Increased `users.password_hash` to 200 characters and added an ALTER statement to `database/auth.sql` for existing installations. This addresses the earlier password-hash column-length registration error.
2. Made vendor creation and vendor-login creation one database transaction, so an incomplete vendor account is not left behind.
3. New fruits now automatically receive three stock rows and three editable package-price rows (initial price 0) for small, medium and large packaging.
4. Sales now use the selling prices stored in `packaging_prices`, rather than trusting a price sent by the browser.
5. Sales combine repeated fruit/package lines before checking available stock, preventing a split-line order from overselling stock.
6. Kept the server alive when MySQL cannot be reached and verified the `/api/health` endpoint responds.
7. Removed the uploaded `.env` file from the deliverable because it contained database and account credentials. Use `.env.example` to create your own private `.env` file.

## Not completed by editing the ZIP
- The project has not been deployed, so a live website URL still needs to be created.
- The GitHub repository link and demonstration recording must be produced by the student.
- Full database integration tests require the student's MySQL server and credentials; syntax checks and the HTTP health check were performed here.
