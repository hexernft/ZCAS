# Meat pie orders: Google Sheets connection

The website sends validated orders to api/event-orders.js. That function checks the Apps Script receiver supports version 2 before writing, and requires the saved date in its acknowledgement.

The receiver in Code.gs creates a Meat Pie Orders tab with Requested date and Day of week columns. Earlier Kuje Orders records remain intact. Totals are computed by the receiver; bank transfers remain Awaiting verification and pay-later orders remain Unpaid.

To update the receiver: replace Code.gs, save, then Deploy > Manage deployments > Edit > Version: New version > Deploy. Keep Execute as: Me and Who has access: Anyone. Preserve the existing /exec URL, or update GOOGLE_ORDERS_SCRIPT_URL in Vercel if using a new deployment. The spreadsheet remains private.

The public page remains at kuje-preorder.html so existing shared links continue working. Its title is now Meat Pie Order. Review opens a modal dialog; a confirmed save opens a full-page success view with Order again. The customer date is displayed with a weekday and full month; the sheet stores ISO date and weekday separately.
