# Instruções gerais do projeto

## Stack

- Use Node.js 22 ou superior na API, porque o projeto utiliza `node:sqlite`.
- Use Express para disponibilizar a API HTTP em JSON.
- Use SQLite como banco embutido, porque a execução não pode depender de servidor de banco, Docker ou serviço externo.
- Use React com Vite na interface web, porque essa combinação é leve para os computadores da equipe.
- Use `node:test` nos testes da API.
- Use Vitest e React Testing Library nos testes da interface.

## Contrato

- Trate `contrato-api.md` como imutável, porque suas rotas, campos, códigos de retorno e dados iniciais serão usados pelo juiz.
- Não renomeie campos nem códigos de erro para melhorar a aparência.
- A API deve responder por HTTP usando JSON.
- Preserve o modo de teste e o relógio controlado exigidos pelo contrato.
- Centralize a consulta ao horário em uma abstração própria, para que os testes não dependam diretamente do relógio real.

## Desenvolvimento

- Trabalhe apenas a regra ou fatia solicitada da spec.
- Use TDD: primeiro crie um teste que falhe pelo motivo esperado, depois implemente o código mínimo e execute toda a suíte.
- Não altere um teste existente apenas para tornar a implementação verde.
- Cada regra implementada deve ser rastreável até a spec e a pergunta da entrevista que a originou.
- Não implemente M4 ou M5, porque este grupo possui três integrantes e desenvolverá somente M1, M2 e M3.
- Não implemente login, senha ou serviços externos quando estiverem fora do contrato.

## Organização

- A API fica em `api/`.
- A interface web fica em `app/`.
- As entrevistas ficam em `entrevistas/`.
- As especificações ficam em `specs/`.
- Os pareceres dos agentes ficam em `auditorias/`.
- As skills ficam em `.opencode/skills/`.
- Os subagentes ficam em `.opencode/agent/`.

## Documento reservado

- Nunca procure, leia ou peça o documento externo de requisitos.
- O documento externo é consultado somente pelos alunos durante a rodada 2.
- Use como fontes apenas `contrato-api.md`, as entrevistas e as specs presentes no repositório.

## Segurança e escopo

- Não registre chaves, senhas, tokens ou dados sensíveis no código, nos commits ou nas sessões.
- Não use MySQL, PostgreSQL, Docker ou serviços em nuvem, porque o banco precisa ser embutido.
- Antes de alterar um arquivo compartilhado, verifique se existem mudanças recentes dos outros integrantes.
# AGENTS.md — Semana Acadêmica

Orientações aprendidas ao trabalhar com agentes. Valem para qualquer módulo.
`api/` e `ui/` seguem os seus próprios `AGENTS.md`, que não são alterados por estas regras.

## Dependências entre módulos

- Ao depender de um módulo que ainda não foi implementado, **não implemente o módulo do
  colega**. Use seed/helper nos testes para prover o dado do qual o seu módulo precisa.
- Não expandir o trabalho para além do seu módulo: cada integrante é dono do escopo dele.

## TDD

- Produza o **teste vermelho antes da implementação**. Teste que já passa antes de existir
  código não está provando nada.
- Não agrupe regras de modo que uma regra nunca tenha evidência RED própria. Cada regra
  precisa de um momento em que está com o seu teste falhando sozinha — sem isso, não há
  prova de que ela foi desenvolvida por TDD.

## Testes existentes

- **Não altere testes existentes apenas para fazê-los passar.** Trocar o esperado pela
  saída do código troca o contrato pela implementação. Só se altera um teste quando a
  **spec** mudou — e aí se diz qual regra mudou e por quê.

## Escopo

- Respeite a spec do seu módulo e o módulo de cada integrante. Implemente só o que a spec
  pede; o que está em `Fora de escopo`, ou fora da spec, não entra.
## 1. Identidade do projeto

Projeto **Semana Acadêmica**.

A API (`api/`) é atualmente o principal subprojeto executável.

A raiz **não possui `package.json`**.

Todos os comandos da API são executados dentro de `api/`.

---

## 2. Estrutura principal

| Pasta | Descrição |
|-------|-----------|
| `api/` | Aplicação Fastify (Node.js + TypeScript) |
| `specs/` | Especificações funcionais por módulo (ex: `M1-grade-de-atividades.md`) |
| `entrevistas/` | Decisões explícitas obtidas via `grilling` (ex: `M1-grade.md`) |
| `auditorias/` | Registros de auditoria de conformidade |
| `.opencode/` | Skills e agentes do opencode (grilling, to-spec, tdd, novo-subagente) |

---

## 3. Hierarquia de fontes (regra obrigatória)

1. **`specs/`** — define os requisitos funcionais da tarefa.
2. **`entrevistas/`** — registra decisões explícitas tomadas para preencher ambiguidades da especificação.
3. **Código existente** — não deve ser tratado como fonte de verdade quando estiver em conflito com uma decisão funcional documentada.
4. Antes de alterar regras funcionais, consultar a spec e a entrevista correspondente.
5. Não alterar a spec apenas para fazer o código atual parecer correto.

---

## 4. Processo de desenvolvimento

- Usar **`grilling`** para descobrir decisões implícitas antes de implementar.
- Registrar decisões em **`entrevistas/`**.
- Usar **`to-spec`** quando houver necessidade de transformar decisões em especificação verificável.
- Usar **TDD** para implementação (fatias verticais, teste primeiro).
- Ciclo TDD: teste falha → implementação mínima → teste passa → próxima fatia.
- Usar **auditoria** quando a etapa exigir verificação de conformidade.

---

## 5. Regra importante sobre o M1

O arquivo `entrevistas/M1-grade.md` contém decisões funcionais aprovadas para o M1 (Grade de Atividades).

Decisões específicas do M1 devem ser consultadas diretamente em:

```
entrevistas/M1-grade.md
```

Não replicar as decisões aqui.

---

## 6. API

Para regras específicas da API (stack, comandos, estrutura interna, modo de teste, autenticação, banco, convenções), consulte:

```
api/AGENTS.md
```

---

## 7. Comandos (executados dentro de `api/`)

```bash
cd api
npm install
```

```bash
npm run dev
```

```bash
npm test
```

```bash
npm run test:watch
```

```bash
npm run build
```

```bash
npm start
```

---

## 8. Regra sobre arquivos

- Não modificar `specs/` para corrigir comportamento de implementação.
- Não modificar `entrevistas/` para refletir código automaticamente.
- Alterações funcionais devem respeitar as decisões registradas.
- Não criar novas tecnologias, frameworks ou dependências sem necessidade.

---

## 9. Conflito entre implementação e decisão funcional

Quando houver divergência entre implementação existente e decisão funcional registrada em `entrevistas/`, a decisão funcional documentada deve ser considerada antes da implementação.
