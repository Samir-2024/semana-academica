# Instruções da API

- Use Node.js com módulos ES e Express.
- Use somente `node:sqlite` como banco, para manter a execução sem servidor externo.
- Exporte a aplicação Express separadamente do servidor que abre a porta, permitindo testes com Supertest.
- Centralize a criação e a conexão do banco em um módulo próprio.
- Centralize a obtenção do horário em um relógio substituível pelo modo de teste.
- Implemente exatamente as rotas, campos, status HTTP e códigos de erro de `../contrato-api.md`.
- Identifique o usuário somente conforme o cabeçalho definido no contrato; não crie login ou senha.
- Use `node:test` e Supertest nos testes da API.
- Para cada regra, escreva primeiro um teste que falhe pelo motivo esperado.
- Não altere testes existentes para esconder uma regressão.
- Não use MySQL, Docker, variáveis secretas ou serviços externos.
- Não leia o documento externo de requisitos; use apenas o contrato, entrevistas e specs do repositório.