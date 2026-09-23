import express from 'express';
import { reinicializarBanco } from './banco.js';
import { definirAgora, obterAgora, resetarRelogio } from './relogio.js';

function criarApp({ banco } = {}) {
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

  app.post('/_teste/reset', (req, res) => {
    if (process.env.MODO_TESTE !== '1') {
      return res.sendStatus(404);
    }

    if (banco) reinicializarBanco(banco);
    resetarRelogio();
    return res.sendStatus(204);
  });

  return app;
}

const app = criarApp();

export { app, criarApp };
