# AgroControl App

Frontend web do AgroControl, construído com Angular 21 e Angular Material.

## Requisitos

- Node.js compatível com Angular 21
- npm
- AgroControl API em execução

## Executar

```bash
npm install
npm start
```

A URL da API está em `src/environments/environment.ts`.

## Estrutura inicial

```text
src/app/
├── core/          # autenticação, guards e interceptors
├── features/      # telas por domínio
├── layout/        # shell autenticado
└── shared/        # componentes reutilizáveis futuros
```

## Funcionalidades iniciais

- login integrado a `POST /api/auth/login`;
- armazenamento da sessão JWT;
- interceptor Bearer;
- proteção de rotas;
- dashboard;
- listagem de insumos;
- listagem de lotes de estoque.
