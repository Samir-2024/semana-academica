import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';

describe('Modo de Teste - Sem MODO_TESTE=1', () => {
  it('responde 404 para GET /_teste/relogio quando MODO_TESTE nao e 1', async () => {
    delete process.env.MODO_TESTE;
    const res = await request(app).get('/_teste/relogio');
    assert.equal(res.status, 404);
  });

  it('responde 404 para PUT /_teste/relogio quando MODO_TESTE nao e 1', async () => {
    delete process.env.MODO_TESTE;
    const res = await request(app)
      .put('/_teste/relogio')
      .send({ agora: '2026-10-19T10:00:00-03:00' });
    assert.equal(res.status, 404);
  });

  it('responde 404 para POST /_teste/reset quando MODO_TESTE nao e 1', async () => {
    delete process.env.MODO_TESTE;
    const res = await request(app).post('/_teste/reset');
    assert.equal(res.status, 404);
  });
});

describe('Modo de Teste - Com MODO_TESTE=1', () => {
  it('GET /_teste/relogio retorna 200 e o horaria inicial do contrato', async () => {
    process.env.MODO_TESTE = '1';
    const res = await request(app).get('/_teste/relogio');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { agora: '2026-10-13T09:00:00-03:00' });
  });

  it('PUT /_teste/relogio altera e mantem o relogio parado no novo instante', async () => {
    process.env.MODO_TESTE = '1';
    const agora = '2026-10-19T10:00:00-03:00';

    const alteracao = await request(app).put('/_teste/relogio').send({ agora });

    assert.equal(alteracao.status, 200);
    assert.deepEqual(alteracao.body, { agora });

    await new Promise((resolve) => setTimeout(resolve, 20));
    const consulta = await request(app).get('/_teste/relogio');
    assert.deepEqual(consulta.body, { agora });
  });
});
