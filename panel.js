// panel.js

let capturedAPIs = [];
let selectedAPIs = new Set();

function renderAPIList() {
  const apiListDiv = document.getElementById('api-list');
  if (capturedAPIs.length === 0) {
    apiListDiv.innerHTML = '<div class="text-gray-500">No APIs captured yet. Make some XHR/fetch requests.</div>';
    return;
  }
  apiListDiv.innerHTML = capturedAPIs.map((api, idx) => `
    <div class="flex items-center mb-2">
      <input type="checkbox" id="api-${idx}" class="mr-2" ${selectedAPIs.has(idx) ? 'checked' : ''} />
      <label for="api-${idx}" class="flex-1 cursor-pointer">
        <span class="font-mono text-xs">[${api.method}]</span> <span class="break-all">${api.url}</span>
      </label>
    </div>
  `).join('');
  // Add event listeners for checkboxes
  capturedAPIs.forEach((_, idx) => {
    document.getElementById(`api-${idx}`).addEventListener('change', (e) => {
      if (e.target.checked) {
        selectedAPIs.add(idx);
      } else {
        selectedAPIs.delete(idx);
      }
      // FIX: Enable/disable button on checkbox change
      document.getElementById('run-test').disabled = selectedAPIs.size === 0;
    });
  });
}

document.getElementById('root').innerHTML = `
  <h1 class='text-xl font-bold mb-4'>API Performance Tester</h1>
  <div class='mb-2 flex gap-2'>
    <label class='flex items-center gap-1 text-sm'>VUs
      <input id='vus-input' type='number' min='1' value='5' class='w-16 px-1 py-0.5 border rounded'/>
    </label>
    <label class='flex items-center gap-1 text-sm'>Duration (s)
      <input id='duration-input' type='number' min='1' value='3' class='w-20 px-1 py-0.5 border rounded'/>
    </label>
  </div>
  <div id='api-list'></div>
  <div class='flex gap-2 mt-4'>
    <button id='run-test' class='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50' disabled>Run Load Test</button>
    <button id='clear-test' class='px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400'>Clear</button>
  </div>
  <div id='test-results' class='mt-4'></div>
`;

renderAPIList();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'API_CAPTURED') {
    // Avoid duplicates (by url+method)
    if (!capturedAPIs.some(api => api.url === message.api.url && api.method === message.api.method)) {
      capturedAPIs.push(message.api);
      renderAPIList();
      document.getElementById('run-test').disabled = selectedAPIs.size === 0;
    }
  }
});

// Enable/disable run button based on selection
const observer = new MutationObserver(() => {
  // This still helps when the list itself rerenders
  document.getElementById('run-test').disabled = selectedAPIs.size === 0;
});
observer.observe(document.getElementById('api-list'), { childList: true, subtree: true });

document.getElementById('run-test').addEventListener('click', async () => {
  const runButton = document.getElementById('run-test');
  const testResultsDiv = document.getElementById('test-results');
  const vus = parseInt(document.getElementById('vus-input').value, 10) || 1;
  const duration = parseInt(document.getElementById('duration-input').value, 10) || 1;

  // UI FEEDBACK: Disable button and show running message
  runButton.disabled = true;
  testResultsDiv.innerHTML = '<span class="text-gray-500">Running load test...</span>';

  function generateK6Script(api, vus, duration) {
    // Basic k6 script for a single API
    return `
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  vus: ${vus},
  duration: '${duration}s',
};

export default function () {
  let res = http.request('${api.method}', '${api.url}', ${api.method === 'POST' || api.method === 'PUT' ? 'JSON.stringify(' + (api.postData?.text ? api.postData.text : '{}') + ')' : 'null'}, {
    headers: ${JSON.stringify((api.headers || []).reduce((acc, h) => { if (!h.name.startsWith(':')) acc[h.name] = h.value; return acc; }, {}))}
  });
  check(res, { 'status is 2xx/3xx': (r) => r.status >= 200 && r.status < 400 });
}
`;
  }

  try {
    let results = [];
    for (const idx of selectedAPIs) {
      const api = capturedAPIs[idx];
      const k6Script = generateK6Script(api, vus, duration);
      // Send to local k6 runner
      const response = await fetch('http://localhost:8765/run-k6', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: k6Script })
      });
      if (!response.ok) throw new Error('Failed to run k6');
      const { summary } = await response.json();
      results.push({ api, summary });
    }
    // Show results
    testResultsDiv.innerHTML = results.map(({ api, summary }) => {
      const metrics = summary?.metrics || {};
      const checks = metrics.checks;
      const successRate = (checks && checks.count > 0)
        ? ((checks.passes / checks.count) * 100).toFixed(1) + '%'
        : 'N/A';
      return `
        <div class="mb-4 p-2 border rounded">
          <div class="font-mono text-xs mb-1 truncate">[${api.method}] ${api.url}</div>
          <div class="text-sm">Requests: ${metrics.http_reqs?.count ?? '-'}</div>
          <div class="text-sm">Success Rate: ${successRate}</div>
          <div class="text-sm">Avg Duration: ${metrics.http_req_duration ? metrics.http_req_duration.avg.toFixed(2) + 'ms' : '-'}</div>
          <div class="text-sm text-red-600">Errors: ${checks && typeof checks.fails === 'number' ? checks.fails : '-'}</div>
          <details class="mt-2"><summary class="cursor-pointer text-xs text-gray-500">Raw k6 summary</summary><pre class="text-xs bg-gray-100 p-2 rounded">${JSON.stringify(summary, null, 2)}</pre></details>
        </div>
      `;
    }).join('');
  } catch (error) {
    testResultsDiv.innerHTML = `<span class="text-red-500">An error occurred during test: ${error.message}</span>`;
    console.error("Test execution error:", error);
  } finally {
    // UI FEEDBACK: Re-enable button after test is complete
    runButton.disabled = selectedAPIs.size === 0;
  }
});

document.getElementById('clear-test').addEventListener('click', () => {
  // Clear test results
  document.getElementById('test-results').innerHTML = '';
  // Unselect all APIs
  selectedAPIs.clear();
  renderAPIList();
  // Disable run button
  document.getElementById('run-test').disabled = true;
});

chrome.devtools.network.onRequestFinished.addListener(function(request) {
  if (request.request && (request.request.url.startsWith('http') || request.request.url.startsWith('https'))) {
    // Filter XHR/fetch
    if (request.type === 'xhr' || request.type === 'fetch') {
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