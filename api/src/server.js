import { fileURLToPath } from 'node:url';
import { criarApp } from './app.js';
import { abrirBanco, fecharBanco } from './banco.js';

const caminhoPadrao = fileURLToPath(new URL('../data/api.sqlite', import.meta.url));
const banco = abrirBanco(process.env.BANCO_CAMINHO ?? caminhoPadrao);
const app = criarApp({ banco });
const port = Number(process.env.PORT ?? 3000);
const servidor = app.listen(port);

let encerrando = false;
function encerrar() {
  if (encerrando) return;
  encerrando = true;

  servidor.close((erro) => {
    fecharBanco(banco);
    process.exitCode = erro ? 1 : 0;
  });
}

process.on('SIGINT', encerrar);
process.on('SIGTERM', encerrar);
