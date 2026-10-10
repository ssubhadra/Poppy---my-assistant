require('dotenv').config();

const express = require('express');
const cors = require('cors');
const chatRouter = require('./src/chatRouter');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/', (_req, res) => {
  res.send('Express backend is running');
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', chatRouter);

app.listen(port, () => {
  console.log(`Backend API listening on http://localhost:${port}`);
});