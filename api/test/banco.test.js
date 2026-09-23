import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { abrirBanco, fecharBanco } from '../src/banco.js';

describe('Banco de dados inicial', () => {
  const banco = abrirBanco(':memory:');

  after(() => fecharBanco(banco));

  it('carrega exatamente o evento, os usuarios e as salas da secao 4', () => {
    const evento = banco.prepare('SELECT * FROM eventos').all().map((linha) => ({ ...linha }));
    const usuarios = banco.prepare('SELECT * FROM usuarios ORDER BY id').all()
      .map((linha) => ({ ...linha }));
    const salas = banco.prepare('SELECT * FROM salas ORDER BY id').all()
      .map((linha) => ({ ...linha }));

    assert.deepEqual(evento, [{
      id: 'semana-academica-2026',
      nome: 'Semana Acadêmica 2026',
      inicio: '2026-10-19',
      fim: '2026-10-23',
      fusoHorario: 'America/Sao_Paulo',
    }]);
    assert.deepEqual(usuarios, [
      { id: 'org-ana', nome: 'Ana Beatriz Lima', papel: 'organizacao' },
      { id: 'org-bruno', nome: 'Bruno Tavares', papel: 'organizacao' },
      { id: 'p-carla', nome: 'Carla Mendes Souza', papel: 'participante' },
      { id: 'p-diego', nome: 'Diego Alves', papel: 'participante' },
      { id: 'p-elisa', nome: 'Elisa Fernandes da Rocha', papel: 'participante' },
      { id: 'p-fabio', nome: 'Fábio Nogueira', papel: 'participante' },
      { id: 'p-gabriela', nome: 'Gabriela Moura Castro', papel: 'participante' },
      { id: 'p-heitor', nome: 'Heitor Campos', papel: 'participante' },
      { id: 'p-isadora', nome: 'Isadora Ribeiro dos Santos', papel: 'participante' },
      { id: 'p-joao', nome: 'João Pedro Martins', papel: 'participante' },
    ]);
    assert.deepEqual(salas, [
      { id: 'auditorio', nome: 'Auditório Central', capacidade: 200 },
      { id: 'lab-3', nome: 'Laboratório 3', capacidade: 20 },
      { id: 'sala-101', nome: 'Sala 101', capacidade: 40 },
      { id: 'sala-102', nome: 'Sala 102', capacidade: 40 },
    ]);
  });
});
