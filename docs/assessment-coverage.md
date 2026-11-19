# DIWA2110 Take-Home Test — coverage map

| Brief section | Project implementation |
|---|---|
| Part A — 8 relational tables, keys, constraints, sample fruit data, pack-size stock | `database/schema.sql`; optional supplier/vendor/opening stock data in `database/demo_seed.sql` |
| Part B — Node project structure, mysql2, .env, async/await, error handling | `server.js`, `src/config/db.js`, `src/controllers`, `src/routes`, `src/models` (folder reserved), `src/middleware`, `.env.example` |
| Part C — supplier, fruit/stock, vendor, purchase, sales APIs and HTTP validation | `src/routes/index.js`, `src/controllers/*`, `src/middleware/*` |
| Part D — totals, stock updates, reports, transactions, payment status and balances | `src/controllers/transactionController.js`, `src/controllers/reportController.js`, `src/services/transactions.js`, `database/reports.sql` |

## Transaction demonstration
For a sale with multiple fruit lines, each stock row is selected `FOR UPDATE` inside one transaction and checked before any sale header, details or stock updates are committed. If one requested quantity is unavailable, the thrown error invokes `ROLLBACK`. This prevents a partial sale and prevents negative stock. Purchase entries also use one transaction so the purchase header, details and stock increments succeed or fail together.
