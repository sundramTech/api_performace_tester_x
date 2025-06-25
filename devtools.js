// devtools.js

// Create the panel
chrome.devtools.panels.create(
  "Fcuk API",
  "icons/icon128.png",
  "panel.html",
  function(panel) {
    // code to run when the panel is created
  }
);

chrome.devtools.network.onRequestFinished.addListener(function(request) {
  try {
    // If chrome.runtime or its id is not available, the context has been invalidated.
    // This can happen when the extension is reloaded or the devtools window is closed.
    if (!chrome.runtime || !chrome.runtime.id) {
      return;
    }

    // DEBUG: Log every request to see its properties
    console.log('🕵️‍♂️ DevTools Saw Request:', request);

    if (request.request && (request.request.url.startsWith('http') || request.request.url.startsWith('https'))) {
      // Filter XHR/fetch
      if (request._resourceType === 'xhr' || request._resourceType === 'fetch') {
        chrome.runtime.sendMessage({
          type: 'API_CAPTURED',
          api: {
            url: request.request.url,
            method: request.request.method,
            headers: request.request.headers,
            postData: request.request.postData
          }
        });
      }
    }
  } catch (e) {
    if (e.message.includes('Extension context invalidated.')) {
      // This error is expected when the extension is reloaded. We can safely ignore it.
    } else {
      console.error('An unexpected error occurred in the devtools network listener:', e);
    }
  }
}); 