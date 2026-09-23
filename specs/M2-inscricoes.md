# Spec — M2 Inscrições e Lista de Espera

## 1. Objetivo
Gerenciar inscrições de participantes em atividades: inscrição, cancelamento, fila de espera, convocação, confirmação de convocação e listagem. Com validações de conflito de horário, limite de minicursos, janelas de inscrição/confirmação e precedência de erros.

## 2. Fora de escopo
- Criação/alteração de atividades → M1
- Presença por QR → M3
- Certificados/extrato → M4
- Painel da organização/bloqueios → M5
- Criação de usuários/salas (dados iniciais fixos)

## 3. Modelo

### Atividade (resumo para M2)
| Campo | Tipo |
|---|---|
| id | string (`atv_` + 8 hex) |
| titulo | string |
| tipo | "palestra" \| "minicurso" |
| salaId | string |
| vagas | integer |
| encontros | array de `{id, inicio, fim}` |

### Inscricao
| Campo | Tipo | Origem |
|---|---|---|
| id | string (prefixo `ins_` + 8 hex) | calculado |
| atividadeId | string | informado pela rota |
| participanteId | string | derivado (cabeçalho `X-Usuario`) |
| status | `"confirmada" \| "em_espera" \| "convocada" \| "cancelada" \| "expirada"` | calculado |
| posicaoNaEspera | integer ou null | derivado (só quando `em_espera`) |
| convocadaAte | string (ISO 8601) ou null | derivado (só quando `convocada`) |
| criadaEm | string (ISO 8601) | calculado |

## 4. Endpoints

| Método | Rota | Quem | Sucesso | Corpo entrada |
|---|---|---|---|---|
| POST | `/atividades/:id/inscricoes` | participante | 201 `Inscricao` | — |
| GET | `/inscricoes` | todos | 200 `[Inscricao]` | query: `atividadeId=` |
| GET | `/inscricoes/:id` | todos | 200 `Inscricao` | — |
| POST | `/inscricoes/:id/cancelamento` | participante | 200 `Inscricao` | — |
| POST | `/inscricoes/:id/confirmacao` | participante | 200 `Inscricao` | — |

## 5. Regras

### Inscrição (POST /atividades/:id/inscricoes)

**R1**  
A inscrição só é permitida dentro da janela: do início do evento (19/10/2026) até o início do primeiro encontro da atividade. Fora → `422 INSCRICOES_ENCERRADAS`.

**R2**  
Se a atividade estiver cancelada → `422 ATIVIDADE_CANCELADA`.

**R3**  
Se o participante já tem inscrição `confirmada` ou `em_espera` na mesma atividade → `409 JA_INSCRITO`.

**R4**  
Se o participante tem inscrição `confirmada` ou `em_espera` em outra atividade com algum encontro sobreposto (mesmo dia, horários se sobrepõem) → `409 CONFLITO_DE_HORARIO`.

**R5**  
Limite de minicursos: participante não pode ter mais de 2 inscrições `confirmada` ou `em_espera` em atividades do tipo `minicurso`. Exceder → `422 LIMITE_DE_MINICURSOS`.

**R6**  
Se a atividade tem vagas → status `confirmada`. Se não tem vagas → status `em_espera` (entra na fila). `posicaoNaEspera` = tamanho da fila + 1.

**R7**  
Precedência no POST /inscricoes (após verificações gerais e existência da atividade):  
`ATIVIDADE_CANCELADA` → `INSCRICOES_ENCERRADAS` → `JA_INSCRITO` → `CONFLITO_DE_HORARIO` → `LIMITE_DE_MINICURSOS` → `INSCRICAO_BLOQUEADA` (M5) → `ATIVIDADE_CANCELADA` (atividade cancelada após checagens anteriores?).

### Cancelamento de inscrição (POST /inscricoes/:id/cancelamento)

**R8**  
Só o dono da inscrição (participante) pode cancelar. Outro participante → `403 SOMENTE_PARTICIPANTE` (já no contrato). Organização → `403 SOMENTE_PARTICIPANTE`.

**R9**  
Inscrição `confirmada` → status vira `cancelada`. Vaga liberada → primeira inscrição `em_espera` (por `posicaoNaEspera`) vira `convocada`, `convocadaAte` = agora + 24h.

**R10**  
Inscrição `em_espera` ou `convocada` → status vira `cancelada`. Se `convocada`, vaga liberada → próxima da espera vira `convocada`.

**R11**  
Inscrição já `cancelada` ou `expirada` → `422 INSCRICAO_INATIVA`.

**R12**  
Inscrição `confirmada` cancelada → vaga liberada → se houver espera, primeira vira `convocada` (24h para confirmar).

### Confirmação de convocação (POST /inscricoes/:id/confirmacao)

**R13**  
Só pode confirmar se status = `convocada` e dentro do prazo. Fora → `422 SEM_CONVOCACAO` ou `422 CONVOCACAO_EXPIRADA`.

**R14**  
Prazo de confirmação: 24 horas a partir de `convocadaAte`. Expirado → status vira `expirada` (ou `cancelada`?), próxima da espera sobe. Código: `422 CONVOCACAO_EXPIRADA`.

**R15**  
Confirmar convocação → status vira `confirmada`. `convocadaAte` = null.

**R16**  
Confirmar convocação → valida `CONFLITO_DE_HORARIO` com outras inscrições `confirmada`/`em_espera` do participante. Conflito → `409 CONFLITO_DE_HORARIO`.

**R17**  
Confirmar convocação em minicurso → valida `LIMITE_DE_MINICURSOS` (máx 2 minicursos confirmados/em_espera). Excede → `422 LIMITE_DE_MINICURSOS`.

**R14**  
Tentar confirmar inscrição não `convocada` → `422 SEM_CONVOCACAO`.

**R15**  
Tentar confirmar após `convocadaAte` → `422 CONVOCACAO_EXPIRADA`.

**R16**  
Precedência no POST /confirmacao: `SEM_CONVOCACAO` → `CONVOCACAO_EXPIRADA` → `CONFLITO_DE_HORARIO` → `LIMITE_DE_MINICURSOS`.

**R17**  
Ao confirmar, se houver próxima na espera, ela vira `convocada` (nova `convocadaAte` = agora + 24h).

### Listagem (GET /inscricoes)

**R18**  
Participante (papel `participante`) vê apenas as próprias inscrições. Organização vê todas.

**R19**  
Filtro `?atividadeId=` opcional (apenas para organização).

**R20**  
Resposta inclui `posicaoNaEspera` só se `status = "em_espera"`. `convocadaAte` só se `status = "convocada"`.

**R19**  
GET `/inscricoes/:id` retorna a inscrição (participante só acessa a própria; organização acessa qualquer).

## 6. Critérios de aceite

1. (R1) POST inscrição antes do evento → 422 `INSCRICOES_ENCERRADAS`
2. (R2) POST inscrição em atividade cancelada → 422 `ATIVIDADE_CANCELADA`
3. (R3) Segunda inscrição na mesma atividade → 409 `JA_INSCRITO`
4. (R4) Inscrição com conflito de horário → 409 `CONFLITO_DE_HORARIO`
5. (R5) 3º minicurso → 422 `LIMITE_DE_MINICURSOS`
6. (R6) Inscrição com vagas → `confirmada`; sem vagas → `em_espera` (posição 1)
7. (R7) Precedência: cancelada → encerradas → já inscrito → conflito → limite minicursos
8. (R8) Cancelar inscrição confirmada → vaga liberada, próxima da espera vira `convocada` (24h)
8. (R9) Cancelar inscrição `em_espera` → status `cancelada`
8. (R10) Cancelar inscrição `convocada` → vaga liberada, próxima da espera vira `convocada`
9. (R11) Cancelar inscrição `cancelada`/`expirada` → 422 `INSCRICAO_INATIVA`
10. (R12) Cancelar `confirmada` → próxima da espera vira `convocada` (24h)
11. (R13) Confirmar convocação válida → status `confirmada`
11. (R13) Confirmar fora do prazo (24h) → 422 `CONVOCACAO_EXPIRADA`
12. (R14) Confirmar sem ser `convocada` → 422 `SEM_CONVOCACAO`
12. (R15) Confirmar após `convocadaAte` → 422 `CONVOCACAO_EXPIRADA`
13. (R16) Confirmar gerando conflito de horário → 409 `CONFLITO_DE_HORARIO`
14. (R14) Confirmar 3º minicurso → 422 `LIMITE_DE_MINICURSOS`
15. (R16) Precedência confirmação: sem convocação → expirada → conflito → limite
15. (R17) Confirmar → próxima da espera vira `convocada` (24h)
16. (R18) GET /inscricoes participante → só próprias; org → todas + filtro atividadeId
17. (R19) `posicaoNaEspera` só em `em_espera`; `convocadaAte` só em `convocada`
18. (R19) GET /inscricoes/:id participante só acessa própria; org acessa qualquer

## 7. Como será verificado
Testes de integração HTTP (via `supertest` ou similar) contra a API em modo `MODO_TESTE=1`, usando relógio de teste (`PUT /_teste/relogio`) e `POST /_teste/reset`. Cada critério mapeia para caso de teste automatizado.

## 8. Fatias de entrega

### Fatia 1 — Inscrição básica
- POST `/atividades/:id/inscricoes` → 201 com status correto
- R1, R2, R3, R6, R7 (precedência básica)

### Fatia 2 — Fila de espera e convocação
- R6 (fila), R8-R12 (cancelamento e promoção)
- `convocadaAte`, `posicaoNaEspera`

### Fatia 3 — Confirmação de convocação
- R13-R17: confirmação, janela 24h, precedência, conflitos, limite minicursos

### Fatia 4 — Listagem e conflitos
- R18-R20: listagem, filtros, campos condicionais
- R4, R5, R16, R17: conflitos de horário e limite minicursos na confirmação

### Fatia 5 — Precedência completa
- Testes de precedência em todas as rotas (R7, R10, R16, R17)

---

*Especificação gerada automaticamente baseada no `contrato-api.md` seção M2 e na entrevista `entrevistas/M2-inscricoes.md`.*