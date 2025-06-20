// devtools.js

// Create the panel
chrome.devtools.panels.create(
  "API Performance Tester",
  "icons/icon128.png",
  "panel.html",
  function(panel) {
    // code to run when the panel is created
  }
);

chrome.devtools.network.onRequestFinished.addListener(function(request) {
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
}); 