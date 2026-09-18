const HORARIO_INICIAL = '2026-10-13T09:00:00-03:00';

let relogioAtual = HORARIO_INICIAL;

export function obterAgora() {
  if (process.env.MODO_TESTE === '1') {
    return relogioAtual;
  }
  return new Date().toISOString();
}

export function definirAgora(iso) {
  relogioAtual = iso;
  return relogioAtual;
}

export function resetarRelogio() {
  relogioAtual = HORARIO_INICIAL;
  return relogioAtual;
}
