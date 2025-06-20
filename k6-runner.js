const express = require('express');
const fs = require('fs');
const { exec } = require('child_process');
const app = express();
const PORT = 8765;

app.use(express.json({ limit: '1mb' }));

app.post('/run-k6', (req, res) => {
  const { script } = req.body;
  if (!script) return res.status(400).json({ error: 'No script provided' });
  const scriptPath = './temp-k6-script.js';
  fs.writeFileSync(scriptPath, script);

  // Run k6 with JSON summary output
  exec(`k6 run --summary-export=summary.json ${scriptPath}`, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: stderr || error.message });
    }
    // Read the summary JSON
    let summary = {};
    try {
      summary = JSON.parse(fs.readFileSync('summary.json', 'utf8'));
    } catch (e) {}
    res.json({ stdout, summary });
    // Clean up
    try { fs.unlinkSync(scriptPath); } catch (e) {}
    try { fs.unlinkSync('summary.json'); } catch (e) {}
  });
});

app.listen(PORT, () => {
  console.log(`k6 runner listening on http://localhost:${PORT}`);
}); 