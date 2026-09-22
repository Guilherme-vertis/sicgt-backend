module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.url === '/' && req.method === 'GET') {
    res.status(200).end(JSON.stringify({ service: 'SICGT API', status: 'ok' }));
  } else if (req.url === '/auth/login' && req.method === 'POST') {
    res.status(400).end(JSON.stringify({ error: 'Email and password required' }));
  } else {
    res.status(404).end(JSON.stringify({ error: 'Endpoint not found' }));
  }
};
