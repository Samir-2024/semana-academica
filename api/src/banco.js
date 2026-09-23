import { DatabaseSync } from 'node:sqlite';

const USUARIOS_INICIAIS = [
  ['org-ana', 'Ana Beatriz Lima', 'organizacao'],
  ['org-bruno', 'Bruno Tavares', 'organizacao'],
  ['p-carla', 'Carla Mendes Souza', 'participante'],
  ['p-diego', 'Diego Alves', 'participante'],
  ['p-elisa', 'Elisa Fernandes da Rocha', 'participante'],
  ['p-fabio', 'Fábio Nogueira', 'participante'],
  ['p-gabriela', 'Gabriela Moura Castro', 'participante'],
  ['p-heitor', 'Heitor Campos', 'participante'],
  ['p-isadora', 'Isadora Ribeiro dos Santos', 'participante'],
  ['p-joao', 'João Pedro Martins', 'participante'],
];

const SALAS_INICIAIS = [
  ['auditorio', 'Auditório Central', 200],
  ['sala-101', 'Sala 101', 40],
  ['sala-102', 'Sala 102', 40],
  ['lab-3', 'Laboratório 3', 20],
];

function criarEsquema(banco) {
  banco.exec(`
    CREATE TABLE IF NOT EXISTS eventos (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      inicio TEXT NOT NULL,
      fim TEXT NOT NULL,
      fusoHorario TEXT NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      papel TEXT NOT NULL CHECK (papel IN ('organizacao', 'participante'))
    ) STRICT;
    CREATE TABLE IF NOT EXISTS salas (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      capacidade INTEGER NOT NULL
    ) STRICT;
  `);
}

function inserirDadosIniciais(banco) {
  banco.prepare(`
      INSERT INTO eventos (id, nome, inicio, fim, fusoHorario)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      'semana-academica-2026',
      'Semana Acadêmica 2026',
      '2026-10-19',
      '2026-10-23',
      'America/Sao_Paulo',
  );

  const inserirUsuario = banco.prepare(
    'INSERT INTO usuarios (id, nome, papel) VALUES (?, ?, ?)',
  );
  for (const usuario of USUARIOS_INICIAIS) inserirUsuario.run(...usuario);

  const inserirSala = banco.prepare(
    'INSERT INTO salas (id, nome, capacidade) VALUES (?, ?, ?)',
  );
  for (const sala of SALAS_INICIAIS) inserirSala.run(...sala);
}

function carregarDadosIniciais(banco) {
  banco.exec('BEGIN');
  try {
    inserirDadosIniciais(banco);
    banco.exec('COMMIT');
  } catch (erro) {
    banco.exec('ROLLBACK');
    throw erro;
  }
}

export function abrirBanco(caminho) {
  const banco = new DatabaseSync(caminho);
  criarEsquema(banco);

  const { quantidade } = banco.prepare(
    'SELECT COUNT(*) AS quantidade FROM eventos',
  ).get();
  if (quantidade === 0) carregarDadosIniciais(banco);

  return banco;
}

export function fecharBanco(banco) {
  banco.close();
}

export function reinicializarBanco(banco) {
  banco.exec('BEGIN');
  try {
    banco.exec('DELETE FROM salas; DELETE FROM usuarios; DELETE FROM eventos;');
    inserirDadosIniciais(banco);
    banco.exec('COMMIT');
  } catch (erro) {
    banco.exec('ROLLBACK');
    throw erro;
  }
}
