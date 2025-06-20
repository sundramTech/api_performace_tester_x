// background.js

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Relay messages or handle background tasks
  sendResponse({ received: true });
  return true;
}); 