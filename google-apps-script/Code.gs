const SHEET_NAME = 'Orders';
const DEFAULT_SPREADSHEET_ID = '1Fb9dd9Wn8Igy1KScpMMKzZ5UwOwk_yJK6v-_9YwqOJQ';
const HEADERS = [
  'orderId', 'createdAt', 'status', 'customerName', 'phone', 'city',
  'address', 'notes', 'items', 'subtotal', 'total'
];

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrdersSheet() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') ||
    DEFAULT_SPREADSHEET_ID;
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
  return sheet;
}

function safeCell(value) {
  const text = String(value == null ? '' : value);
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

function doPost(event) {
  try {
    const body = JSON.parse(event.postData.contents || '{}');
    const expectedKey = PropertiesService.getScriptProperties().getProperty('API_KEY');
    if (!expectedKey || typeof body.key !== 'string' || body.key !== expectedKey) {
      return jsonResponse({ ok: false, message: 'Unauthorized' });
    }

    const sheet = getOrdersSheet();
    if (body.action === 'create') {
      const order = body.order;
      if (!order || !order.orderId || !order.customer || !Array.isArray(order.items)) {
        return jsonResponse({ ok: false, message: 'Invalid order data' });
      }
      const lock = LockService.getScriptLock();
      lock.waitLock(10000);
      try {
        const lastRow = sheet.getLastRow();
        if (lastRow > 1 && sheet.getRange(2, 1, lastRow - 1, 1)
          .createTextFinder(String(order.orderId)).matchEntireCell(true).findNext()) {
          return jsonResponse({ ok: true, orderId: order.orderId });
        }
      sheet.appendRow([
        safeCell(order.orderId),
        safeCell(order.createdAt),
        safeCell(order.status || 'New'),
        safeCell(order.customer.name),
        safeCell(order.customer.phone),
        safeCell(order.customer.city),
        safeCell(order.customer.address),
        safeCell(order.customer.notes || ''),
        safeCell(JSON.stringify(order.items)),
        order.subtotal,
        order.total
      ]);
      } finally {
        lock.releaseLock();
      }
      return jsonResponse({ ok: true, orderId: order.orderId });
    }

    if (body.action === 'list') {
      const values = sheet.getDataRange().getValues();
      const orders = values.slice(1).reverse().map(row => ({
        orderId: String(row[0]),
        createdAt: row[1] instanceof Date ? row[1].toISOString() : String(row[1]),
        status: String(row[2]),
        customer: {
          name: String(row[3]),
          phone: String(row[4]),
          city: String(row[5]),
          address: String(row[6]),
          notes: String(row[7] || '')
        },
        items: JSON.parse(String(row[8] || '[]')),
        subtotal: Number(row[9]),
        total: Number(row[10])
      }));
      return jsonResponse({ ok: true, orders });
    }

    if (body.action === 'status') {
      if (!['New', 'Contacted', 'Delivered', 'Cancelled'].includes(body.status)) {
        return jsonResponse({ ok: false, message: 'Invalid order status' });
      }
      const values = sheet.getDataRange().getValues();
      const rowIndex = values.findIndex((row, index) => index > 0 && String(row[0]) === String(body.orderId));
      if (rowIndex < 1) return jsonResponse({ ok: false, message: 'Order not found' });
      sheet.getRange(rowIndex + 1, 3).setValue(body.status);
      return jsonResponse({ ok: true });
    }

    return jsonResponse({ ok: false, message: 'Unknown action' });
  } catch (error) {
    console.error(error);
    return jsonResponse({ ok: false, message: 'Could not process the request' });
  }
}
