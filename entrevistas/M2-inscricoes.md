# Entrevista — M2 Inscrições e Lista de Espera

**Responsável:** Gustavo Ferreira
**Contrato de referência:** `contrato-api.md`, seção 5 (M2)
**Processo:** rodada 1 (grilling) → rodada 2 (consulta aos requisitos) → rodada final (decisões de regra de negócio).

---

## Rotas do módulo (do contrato — não negociável)

| Método | Rota | Quem | Sucesso |
|---|---|---|---|
| POST | `/atividades/:id/inscricoes` | participante | 201 `Inscricao` (sem corpo na entrada) |
| GET | `/inscricoes` | todos | 200 `[Inscricao]` — participante recebe só as próprias; filtro `?atividadeId=` |
| GET | `/inscricoes/:id` | todos | 200 `Inscricao` |
| POST | `/inscricoes/:id/cancelamento` | participante | 200 `Inscricao` |
| POST | `/inscricoes/:id/confirmacao` | participante | 200 `Inscricao` |

Códigos de erro do módulo: `INSCRICOES_ENCERRADAS`, `INSCRICAO_BLOQUEADA`, `JA_INSCRITO`, `CONFLITO_DE_HORARIO`, `LIMITE_DE_MINICURSOS`, `INSCRICAO_INATIVA`, `SEM_CONVOCACAO`, `CONVOCACAO_EXPIRADA`, além dos gerais (`USUARIO_DESCONHECIDO`, `SOMENTE_ORGANIZACAO`, `SOMENTE_PARTICIPANTE`, `NAO_ENCONTRADO`, `DADOS_INVALIDOS`).

O contrato define **o que** a API responde. **Quando** cada código aparece (prazo, limite, janela, tolerância, ordem) é o que esta entrevista levanta.

---

## Rodada 1 — Perguntas da fronteira

Legenda de status: **[ ] pendente** → **[R] requisitos (consultar na rodada 2)** → **[RN] regra de negócio — a decidir na rodada final do grilling** → **[D] decidido pelo grupo**.

### A. Inscrição (POST /atividades/:id/inscricoes)

**P-01 — [D] Janela de inscrição.**  
Quando a inscrição abre/fecha? Relativo ao início do encontro? Da atividade?  
➡️ Recomendação: abre no início do período do evento; fecha no início do primeiro encontro da atividade.

**P-02 — [D] Inscrição em atividade cancelada.**  
Tentar se inscrever em atividade cancelada → `ATIVIDADE_CANCELADA` (antes das demais validações)?

**P-03 — [D] `JA_INSCRITO`.**  
Participante já tem inscrição `confirmada` ou `em_espera` na mesma atividade → `409 JA_INSCRITO`?

**P-04 — [D] `CONFLITO_DE_HORARIO`.**  
Participante já tem inscrição `confirmada`/`em_espera` em outra atividade que tem algum encontro sobreposto → `409 CONFLITO_DE_HORARIO`?

**P-05 — [D] `LIMITE_DE_MINICURSOS`.**  
Participante já inscrito em 2 minicursos (confirmados ou em espera) → tentar inscrever em terceiro → `422 LIMITE_DE_MINICURSOS`? Limite vale para confirmadas + espera?

**P-06 — [D] `INSCRICOES_ENCERRADAS`.**  
Após o prazo de inscrição (ex.: início do primeiro encontro) → `422 INSCRICOES_ENCERRADAS`.

### B. Cancelamento de inscrição (POST /inscricoes/:id/cancelamento)

**P-07 — [D] Cancelar inscrição `confirmada`.**  
Libera vaga → próxima da espera vira `convocada` (se houver).

**P-08 — [D] Cancelar inscrição `em_espera` / `convocada`.**  
Só remove da fila / cancela convocação.

**P-09 — [D] `INSCRICAO_INATIVA`.**  
Tentar cancelar inscrição já `cancelada`/`expirada` → `422 INSCRICAO_INATIVA`.

### C. Confirmação de convocação (POST /inscricoes/:id/confirmacao)

**P-10 — [D] Janela de confirmação.**  
Convocado tem X horas para confirmar. Expirada → `CONVOCACAO_EXPIRADA`, volta para `em_espera` ou `cancelada`?

**P-11 — [D] `CONFLITO_DE_HORARIO` na confirmação.**  
Confirmar convocação gera conflito de horário com outra inscrição `confirmada`/`em_espera` → `409 CONFLITO_DE_HORARIO`.

**P-12 — [D] `LIMITE_DE_MINICURSOS` na confirmação.**  
Confirmar convocação em minicurso faria o participante ter 3 minicursos → `422 LIMITE_DE_MINICURSOS`.

**P-13 — [D] `SEM_CONVOCACAO`.**  
Tentar confirmar inscrição que não está `convocada` → `422 SEM_CONVOCACAO`.

**P-16 — [D] `CONVOCACAO_EXPIRADA`.**  
Tentar confirmar após o prazo → `422 CONVOCACAO_EXPIRADA`.

### D. Listagem (GET /inscricoes, GET /inscricoes/:id)

**P-17 — [D] Filtro `atividadeId` em GET /inscricoes.**  
Participante vê só as próprias. Organização vê todas; filtro `?atividadeId=` opcional.

**P-18 — [D] Campos da resposta.**  
`posicaoNaEspera` só vem quando `status = "em_espera"`. `convocadaAte` só quando `status = "convocada"`.

### E. Precedência geral e fronteira de escopo

**P-19 — [D] Precedência no POST /inscricoes.**  
Quando várias regras recusam a mesma inscrição, ordem entre `INSCRICOES_ENCERRADAS`, `JA_INSCRITO`, `CONFLITO_DE_HORARIO`, `LIMITE_DE_MINICURSOS`, `INSCRICAO_BLOQUEADA`, `ATIVIDADE_CANCELADA`?

**P-20 — [D] Fora de escopo do M2.**  
M2 **não** faz: criar atividade/sala, emitir certificado (M4), presença (M3), bloqueios (M5).

---

## Pendentes para consulta aos requisitos (rodada 2)

| Perq | Assunto | Resposta | Fonte | Status |
|---|---|---|---|---|
| P-01 | Janela de inscrição | | | pendente |
| P-02 | Inscrição em atividade cancelada | | | pendente |
| P-03 | JA_INSCRITO | | | pendente |
| P-04 | CONFLITO_DE_HORARIO | | | pendente |
| P-05 | LIMITE_DE_MINICURSOS | | | pendente |
| P-06 | INSCRICOES_ENCERRADAS | | | pendente |
| P-07 | Cancelar confirmada | | | pendente |
| P-08 | Cancelar espera/convocada | | | pendente |
| P-09 | INSCRICAO_INATIVA | | | pendente |
| P-10 | Janela de confirmação | | | pendente |
| P-11 | CONFLITO_DE_HORARIO na confirmação | | | pendente |
| P-12 | LIMITE_DE_MINICURSOS na confirmação | | | pendente |
| P-13 | SEM_CONVOCACAO | | | pendente |
| P-16 | CONVOCACAO_EXPIRADA | | | pendente |
| P-17 | Filtro atividadeId | | | pendente |
| P-18 | Campos da resposta | | | pendente |
| P-19 | Precedência no POST | | | pendente |
| P-20 | Fora de escopo | | | pendente |

---

## Regras de negócio — separadas para a rodada final

> Decisões de regra de negócio que ficam para a rodada final do grilling (após a consulta aos requisitos). Não pode haver decisão implícita.
> As recomendações da rodada 1 NÃO são decisões. Nenhuma recomendação foi aceita pelo usuário ainda.

| Perq | Assunto | Decisão |
|---|---|---|
| | | |

---

*Documento criado automaticamente como parte da correção de pendências do M1. Baseado no `contrato-api.md` seção M2.*