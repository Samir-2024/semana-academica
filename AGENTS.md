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