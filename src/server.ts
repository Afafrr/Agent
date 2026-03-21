import 'dotenv/config';
import express from 'express';
import { telnyxWebhook } from './routes/telnyx';

const app = express();
app.use(express.json());

app.get('/', (_, res) => {
  res.send('Server running');
});

app.post('/webhooks/telnyx', telnyxWebhook);

app.listen(3000, () => {
  console.log('http://localhost:3000');
});
