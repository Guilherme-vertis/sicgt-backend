export default async (req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    res.status(200).json({ service: 'SICGT API', status: 'ok' });
  } else if (req.method === 'POST' && req.url === '/auth/login') {
    res.status(400).json({ error: 'Email and password required' });
  } else {
    res.status(404).json({ error: 'Endpoint not found' });
  }
};
