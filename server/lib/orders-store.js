const DEFAULT_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbwbsbnom8h1bAD8CpXVggWokleAfeN8Kzh3RRIEfF2Z9oQ6DWeHaSooFPpz-Ppvuiwf/exec';

function getSheetsConfig() {
  const endpoint = process.env.GOOGLE_SHEETS_URL || DEFAULT_SHEETS_URL;
  const key = process.env.GOOGLE_SHEETS_KEY;
  if (!endpoint || !key) {
    const error = new Error('مفتاح Google Sheets ناقص. أضف GOOGLE_SHEETS_KEY في إعدادات Vercel.');
    error.status = 503;
    throw error;
  }
  let parsedEndpoint;
  try {
    parsedEndpoint = new URL(endpoint);
  } catch {
    const error = new Error('GOOGLE_SHEETS_URL يجب أن يكون رابط Web App صالحًا من script.google.com.');
    error.status = 503;
    throw error;
  }
  if (parsedEndpoint.protocol !== 'https:' ||
      parsedEndpoint.hostname !== 'script.google.com' ||
      !parsedEndpoint.pathname.startsWith('/macros/s/')) {
    const error = new Error('GOOGLE_SHEETS_URL يجب أن يكون رابط Web App صالحًا من script.google.com.');
    error.status = 503;
    throw error;
  }
  return { endpoint, key };
}

async function sendToSheets(action, data = {}) {
  const { endpoint, key } = getSheetsConfig();
  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, key, ...data }),
      redirect: 'follow'
    });
  } catch (cause) {
    const error = new Error('تعذر الاتصال بـGoogle Sheets. تحقق من رابط Web App وحاول مجددًا.');
    error.status = 502;
    error.cause = cause;
    throw error;
  }

  const contentType = response.headers.get('content-type') || '';
  const result = contentType.includes('application/json') ? await response.json() : null;
  if (!response.ok || !result?.ok) {
    const error = new Error(result?.message || `تعذر حفظ الطلب في Google Sheets (HTTP ${response.status}).`);
    error.status = response.ok ? 502 : response.status;
    throw error;
  }
  return result;
}

module.exports = { sendToSheets };
