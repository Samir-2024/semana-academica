import express from 'express';
import { definirAgora, obterAgora } from './relogio.js';

const app = express();
app.use(express.json());

app.get('/_teste/relogio', (req, res) => {
  if (process.env.MODO_TESTE !== '1') {
    return res.sendStatus(404);
  }

  return res.json({ agora: obterAgora() });
});

app.put('/_teste/relogio', (req, res) => {
  if (process.env.MODO_TESTE !== '1') {
    return res.sendStatus(404);
  }

  return res.json({ agora: definirAgora(req.body.agora) });
});

export { app };
