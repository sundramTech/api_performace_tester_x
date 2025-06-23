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
    <div class="mb-2">
      <div class="flex items-center">
        <input type="checkbox" id="api-${idx}" class="mr-2" ${selectedAPIs.has(idx) ? 'checked' : ''} />
        <label for="api-${idx}" class="flex-1 cursor-pointer">
          <span class="font-mono text-xs">[${api.method}]</span> <span class="break-all">${api.url}</span>
        </label>
      </div>
      ${api.method === 'POST' && api.postData?.text ? `
        <div id="post-data-${idx}" class="hidden ml-6 mt-2 border-l-2 border-gray-200 pl-4">
          ${createJsonInputs(JSON.parse(api.postData.text), `post-body-${idx}`)}
        </div>
      ` : ''}
    </div>
  `).join('');
  // Add event listeners for checkboxes
  capturedAPIs.forEach((api, idx) => {
    document.getElementById(`api-${idx}`).addEventListener('change', (e) => {
      const postDataContainer = document.getElementById(`post-data-${idx}`);
      if (e.target.checked) {
        selectedAPIs.add(idx);
        if (postDataContainer) {
          postDataContainer.classList.remove('hidden');
        }
      } else {
        selectedAPIs.delete(idx);
        if (postDataContainer) {
          postDataContainer.classList.add('hidden');
        }
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

  function generateK6Script(api, vus, duration, postBody) {
    // Basic k6 script for a single API
    return `
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  vus: ${vus},
  duration: '${duration}s',
};

export default function () {
  let res = http.request('${api.method}', '${api.url}', ${api.method === 'POST' || api.method === 'PUT' ? postBody : 'null'}, {
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
      let postBody = 'null';
      if (api.method === 'POST' && api.postData?.text) {
        const jsonData = reconstructJsonFromInputs(JSON.parse(api.postData.text), `post-body-${idx}`);
        postBody = `JSON.stringify(${JSON.stringify(jsonData)})`;
      }
      const k6Script = generateK6Script(api, vus, duration, postBody);
      // Send to local k6 runner
      const response = await fetch('http://51.21.152.34:8765/run-k6', {
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

function createJsonInputs(json, prefix) {
  return Object.entries(json).map(([key, value]) => {
    const newPrefix = `${prefix}-${key}`;
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        return `
          <fieldset class="mt-2">
            <legend class="text-sm font-medium text-gray-900">${key} [Array]</legend>
            <div class="pl-4 border-l-2 border-gray-200">
              ${value.map((item, index) => {
                const itemPrefix = `${newPrefix}-${index}`;
                if (typeof item === 'object' && item !== null) {
                  return `
                    <fieldset class="mt-2">
                      <legend class="text-sm font-medium text-gray-900">Item ${index + 1}</legend>
                      <div class="pl-4 border-l-2 border-gray-200">
                        ${createJsonInputs(item, itemPrefix)}
                      </div>
                    </fieldset>
                  `;
                }
                return `
                  <div class="mt-2">
                    <label for="${itemPrefix}" class="block text-sm font-medium text-gray-700">${key}[${index}]</label>
                    <input type="text" id="${itemPrefix}" value="${item}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                  </div>
                `;
              }).join('')}
            </div>
          </fieldset>
        `;
      }
      return `
        <fieldset class="mt-2">
          <legend class="text-sm font-medium text-gray-900">${key}</legend>
          <div class="pl-4 border-l-2 border-gray-200">
            ${createJsonInputs(value, newPrefix)}
          </div>
        </fieldset>
      `;
    }
    return `
      <div class="mt-2">
        <label for="${newPrefix}" class="block text-sm font-medium text-gray-700">${key}</label>
        <input type="text" id="${newPrefix}" value="${value}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
      </div>
    `;
  }).join('');
}

function reconstructJsonFromInputs(originalJson, prefix) {
  const result = {};
  for (const key in originalJson) {
    const newPrefix = `${prefix}-${key}`;
    const value = originalJson[key];
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        result[key] = value.map((item, index) => {
          const itemPrefix = `${newPrefix}-${index}`;
          if (typeof item === 'object' && item !== null) {
            return reconstructJsonFromInputs(item, itemPrefix);
          }
          const inputEl = document.getElementById(itemPrefix);
          return inputEl ? inputEl.value : item;
        });
      } else {
        result[key] = reconstructJsonFromInputs(value, newPrefix);
      }
    } else {
      const inputEl = document.getElementById(newPrefix);
      if (inputEl) {
        result[key] = inputEl.value;
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}