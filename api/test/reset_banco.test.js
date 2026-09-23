import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { criarApp } from '../src/app.js';
import { abrirBanco, fecharBanco } from '../src/banco.js';

describe('Reset do banco no modo de teste', () => {
  const banco = abrirBanco(':memory:');
  const app = criarApp({ banco });

  before(() => {
    process.env.MODO_TESTE = '1';
  });

  after(() => {
    delete process.env.MODO_TESTE;
    fecharBanco(banco);
  });

  it('apaga alteracoes e recarrega os dados iniciais sem duplicacao', async () => {
    banco.prepare("UPDATE eventos SET nome = 'Evento alterado'").run();
    banco.prepare("DELETE FROM usuarios WHERE id = 'p-carla'").run();
    banco.prepare(`
      INSERT INTO usuarios (id, nome, papel)
      VALUES ('p-extra', 'Pessoa Extra', 'participante')
    `).run();
    banco.prepare("UPDATE salas SET capacidade = 1 WHERE id = 'auditorio'").run();
    banco.prepare(`
      INSERT INTO salas (id, nome, capacidade)
      VALUES ('sala-extra', 'Sala Extra', 5)
    `).run();

    assert.equal((await request(app).post('/_teste/reset')).status, 204);
    assert.equal((await request(app).post('/_teste/reset')).status, 204);

    assert.deepEqual(
      { ...banco.prepare('SELECT * FROM eventos').get() },
      {
        id: 'semana-academica-2026',
        nome: 'Semana Acadêmica 2026',
        inicio: '2026-10-19',
        fim: '2026-10-23',
        fusoHorario: 'America/Sao_Paulo',
      },
    );
    assert.deepEqual(
      { ...banco.prepare('SELECT COUNT(*) AS usuarios FROM usuarios').get() },
      { usuarios: 10 },
    );
    assert.deepEqual(
      { ...banco.prepare('SELECT COUNT(*) AS salas FROM salas').get() },
      { salas: 4 },
    );
    assert.equal(
      banco.prepare("SELECT COUNT(*) AS total FROM usuarios WHERE id = 'p-extra'").get().total,
      0,
    );
    assert.equal(
      banco.prepare("SELECT capacidade FROM salas WHERE id = 'auditorio'").get().capacidade,
      200,
    );
  });
});
