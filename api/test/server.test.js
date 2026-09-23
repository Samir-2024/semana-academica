import { once } from 'node:events';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

async function obterPortaLivre() {
  const servidor = createServer();
  servidor.listen(0, '127.0.0.1');
  await once(servidor, 'listening');
  const { port } = servidor.address();
  servidor.close();
  await once(servidor, 'close');
  return port;
}

async function esperarResposta(url, processo) {
  const limite = Date.now() + 5_000;
  while (Date.now() < limite) {
    assert.equal(processo.exitCode, null, 'npm start encerrou antes de responder');
    try {
      return await fetch(url);
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
  assert.fail('a API nao respondeu dentro de 5 segundos');
}

describe('Servidor da API', () => {
  it('npm start usa PORT, permanece ativo e encerra banco e servidor com SIGTERM', async () => {
    const port = await obterPortaLivre();
    const processo = spawn('npm', ['start'], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        MODO_TESTE: '1',
        PORT: String(port),
        BANCO_CAMINHO: ':memory:',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let erros = '';
    processo.stderr.on('data', (trecho) => { erros += trecho; });

    try {
      const resposta = await esperarResposta(`http://127.0.0.1:${port}/_teste/relogio`, processo);
      assert.equal(resposta.status, 200);
      assert.deepEqual(await resposta.json(), { agora: '2026-10-13T09:00:00-03:00' });
      assert.equal(processo.exitCode, null);
    } finally {
      processo.kill('SIGTERM');
    }

    const [codigo, sinal] = await once(processo, 'exit');
    assert.equal(sinal, null, erros);
    assert.equal(codigo, 0, erros);
  });

  it('npm start usa a porta 3000 quando PORT nao foi informada', async () => {
    const env = { ...process.env, MODO_TESTE: '1', BANCO_CAMINHO: ':memory:' };
    delete env.PORT;
    const processo = spawn('npm', ['start'], {
      cwd: process.cwd(),
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    try {
      const resposta = await esperarResposta(
        'http://127.0.0.1:3000/_teste/relogio',
        processo,
      );
      assert.equal(resposta.status, 200);
    } finally {
      processo.kill('SIGTERM');
    }

    await once(processo, 'exit');
  });
});
