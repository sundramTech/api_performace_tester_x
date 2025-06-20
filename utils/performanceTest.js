// utils/performanceTest.js

function formatHeaders(headersArray) {
  const headers = {};
  if (!headersArray) return headers;
  headersArray.forEach(h => {
    // Ignore browser-specific pseudo-headers
    if (!h.name.startsWith(':')) {
      headers[h.name] = h.value;
    }
  });
  return headers;
}

export async function runLoadTest({ url, method = 'GET', headers: headersArray = [], body = null, rate = 10, duration = 10 }) {
  const results = [];
  const endTime = Date.now() + duration * 1000;
  const fetchOptions = {
    method,
    headers: formatHeaders(headersArray),
    // Only include body for relevant methods
    body: (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT') ? body : null,
    // Add no-cors to handle cross-origin issues, though this limits response inspection
    mode: 'no-cors' 
  };

  while (Date.now() < endTime) {
    const promises = [];
    for (let i = 0; i < rate; i++) {
      promises.push(
        fetch(url, fetchOptions)
          .then(res => ({ success: res.ok, status: res.status }))
          .catch(error => ({ success: false, error: error.message }))
      );
    }
    results.push(...(await Promise.all(promises)));
    await new Promise(r => setTimeout(r, 1000));
  }
  return results;
}

