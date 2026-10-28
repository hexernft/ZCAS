# Connect ZCAS pre-orders to Google Sheets

1. Open your spreadsheet, then Extensions > Apps Script.
2. Replace the contents of Code.gs with the supplied Code.gs file and save.
3. Select Deploy > New deployment > Web app.
4. Choose Execute as: Me and Who has access: Anyone. Authorize with the Google account that owns the spreadsheet.
5. Copy the Web app URL ending in /exec and send it back to finish setup.

The public app can accept orders but does not provide access to read orders. Keep the spreadsheet private. The script creates a Kuje Orders tab when the first valid order arrives and leaves other tabs intact. Transfer orders start as Awaiting verification; pay-later orders start as Unpaid.

## Website configuration (handled when the deployment URL is available)

Set GOOGLE_ORDERS_SCRIPT_URL in the ZCAS Vercel project's production environment to the /exec URL, then deploy the website files including api/event-orders.js. No Google password or credential belongs in frontend code. The Node function forwards submissions and confirms a saved order before the page shows success. A local file preview cannot run this API.

Verify one clearly labeled test order end to end, including retrying the same reference. Check the quantity, server-calculated total, phone number and payment status in Kuje Orders. Do not mark transfers paid until manually verified. For Apps Script code updates, update the existing deployment to a new version.
