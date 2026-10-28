// Paste into Code.gs in Extensions > Apps Script for your order spreadsheet.
const SPREADSHEET_ID = '1VG0jN5ihI9mphBEe8kiV8AFEhQpgDhcfiZsThCTTLME';
const TAB = 'Kuje Orders';
const HEADERS = ['Order ID', 'Received at (Lagos)', 'Name', 'Phone number', 'Quantity', 'Unit price (NGN)', 'Total (NGN)', 'Payment choice', 'Payment status', 'Event', 'Event date'];
function doGet() {
  return json_({ok: true, service: 'ZCAS event pre-orders'});
}
function doPost(e) {
  let lock;
  try {
    if (!e || !e.postData || e.postData.contents.length > 4096) throw new Error('Invalid request.');
    const order = JSON.parse(e.postData.contents);
    const name = String(order.name || '').trim();
    const phone = String(order.phone || '').replace(/[\s()-]/g, '');
    const quantity = Number(order.quantity);
    if (!/^[a-f0-9-]{36}$/i.test(order.orderId || '')) throw new Error('Invalid order reference.');
    if (name.length < 2 || name.length > 100) throw new Error('Enter your full name.');
    if (!/^(0[789]\d{9}|\+?234[789]\d{9})$/.test(phone)) throw new Error('Enter a valid Nigerian phone number.');
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000) throw new Error('Quantity must be between 1 and 1,000.');
    if (!['Bank transfer', 'Pay later'].includes(order.payment)) throw new Error('Choose a payment preference.');
    lock = LockService.getScriptLock();
    if (!lock.tryLock(15000)) throw new Error('We are busy. Please retry using the same order reference.');
    const book = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = book.getSheetByName(TAB);
    if (!sheet) sheet = book.insertSheet(TAB);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#b84165').setFontColor('#ffffff');
    }
    if (JSON.stringify(sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0]) !== JSON.stringify(HEADERS)) throw new Error('Order sheet headers need attention. Please contact ZCAS.');
    const last = sheet.getLastRow();
    if (last > 1 && sheet.getRange(2, 1, last - 1, 1).createTextFinder(order.orderId).matchEntireCell(true).findNext()) return json_({ok: true, orderId: order.orderId});
    // Prefix user strings to prevent spreadsheet formula execution and preserve phone zeros.
    const literal = value => "'" + value;
    sheet.appendRow([order.orderId, Utilities.formatDate(new Date(), 'Africa/Lagos', 'yyyy-MM-dd HH:mm:ss'), literal(name), literal(phone), quantity, 1500, quantity * 1500, order.payment, order.payment === 'Pay later' ? 'Unpaid' : 'Awaiting verification', 'Kuje Miracle Crusade', '2026-11-06']);
    SpreadsheetApp.flush();
    return json_({ok: true, orderId: order.orderId});
  } catch (error) {
    return json_({ok: false, error: 'Order could not be saved. Check your details and retry with the same reference.'});
  } finally { if (lock && lock.hasLock()) lock.releaseLock(); }
}
function json_(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
