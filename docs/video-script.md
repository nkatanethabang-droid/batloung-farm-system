# Suggested recorded demonstration narration

Good day. This is the Batloung Farm Distribution Management System, developed for the DIWA2110 Web Application Development take-home test. Batloung Farm operates in Maseru and distributes fresh produce sourced from suppliers in South African provinces to vendors and small retailers in Lesotho.

The dashboard gives the administrator a quick overview of suppliers, vendors, boxes in stock, sales revenue and outstanding vendor balances. The design follows the supplied fresh-produce reference, using a dark green and gold colour palette.

In Supplier Management, the administrator can register and maintain supplier records, including their business name, contact person, telephone number, province and address. The province list contains the eight provinces specified in the task.

In Fruits and Stock, the five required fruits are available: apples, bananas, oranges, mangoes and grapes. Stock is not stored as one combined total. Every fruit has separate small, medium and large box balances. Selling prices are also configured separately for each packaging size.

In Vendor Management, the administrator registers street vendors and small retailers and can search for a vendor using a name or telephone number.

In Purchases, the administrator selects a supplier and can add several fruit items to one purchase. The application calculates the purchase total and increases the matching stock balances automatically.

In Sales, the administrator selects a vendor and adds several fruit items. The server calculates the total using the quantity and unit price for each item. It checks stock before committing the sale. If one line requests more boxes than are available, the transaction is rolled back, so none of the items are deducted and no incomplete sale is saved.

The payment feature supports cash, mobile money and credit. It records PAID, PARTIALLY_PAID or UNPAID and allows a later payment to reduce the outstanding balance.

Finally, Reports displays the five most frequently sold fruits, sales revenue for a selected date range, the vendor with the highest number of boxes purchased, stock levels by packaging size and vendor outstanding balances.

The application uses Node.js, Express, mysql2 and MySQL. Database credentials are kept in environment variables. Database operations use async and await, error handling and transactions with commit and rollback. This completes the main functional requirements of the Batloung Farm take-home test. Thank you.
