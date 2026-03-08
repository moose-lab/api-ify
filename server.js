const express = require('express');
const { execFile } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS headers for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Parse JSON request bodies
app.use(express.json());

// Serve static files from the current directory
app.use(express.static(path.join(__dirname)));

// POST /api/waitlist
app.post('/api/waitlist', (req, res) => {
  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Shanghai' });
  const subject = `[API-ify Waitlist] New signup: ${email}`;
  const body = `New waitlist registration:\n\nEmail: ${email}\nTime: ${timestamp}\n\n-- API-ify Waitlist Bot`;

  const rawMessage = [
    `To: moosemosse19@gmail.com`,
    `Subject: ${subject}`,
    `Content-Type: text/plain; charset="UTF-8"`,
    '',
    body
  ].join('\r\n');

  const base64url = Buffer.from(rawMessage)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const messageJson = JSON.stringify({ raw: base64url });

  execFile('npx', [
    '@googleworkspace/cli',
    'gmail',
    'users',
    'messages',
    'send',
    '--params', JSON.stringify({ userId: 'me' }),
    '--json', messageJson
  ], { timeout: 30000 }, (error, stdout, stderr) => {
    if (error) {
      console.error('Failed to send notification email:', error.message);
      if (stderr) console.error('stderr:', stderr);
      return res.status(500).json({ error: 'Failed to send notification email' });
    }
    console.log('Notification email sent for:', email);
    res.json({ success: true });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
