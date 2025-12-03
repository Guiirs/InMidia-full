# InMidia V3 - Ambiente de Desenvolvimento

Sistema completo com Frontend (React + Vite) e Backend (Node.js + Express).

## 🚀 Início Rápido

### 1. Instalar Dependências

```bash
# Instalar em todos os projetos (raiz, BECKEND e REACT)
npm run install:all
```

### 2. Configurar Variáveis de Ambiente

Certifique-se que `BECKEND/.env` está configurado com:
```env
MONGODB_URI=sua_connection_string
JWT_SECRET=seu_secret
PORT=4000
# ... outras variáveis
```

### 3. Iniciar Desenvolvimento

```bash
# Inicia Frontend e Backend simultaneamente
npm run dev
```

ou

```bash
node start-dev.js
```

## 📦 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia Frontend e Backend juntos |
| `npm start` | Alias para `npm run dev` |
| `npm run backend` | Inicia apenas o Backend |
| `npm run frontend` | Inicia apenas o Frontend |
| `npm run install:all` | Instala dependências em todos os projetos |
| `npm test` | Executa testes do Backend |

## 🌐 URLs Padrão

- **Backend**: http://localhost:4000
- **Frontend**: http://localhost:5173

## 🛑 Parar Servidores

Pressione `Ctrl+C` no terminal para parar ambos os servidores simultaneamente.

## 📁 Estrutura do Projeto

```
backstage/
├── BECKEND/          # Backend (Node.js + Express)
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── PISystemGen/  # Sistema de geração de PI
│   └── package.json
│
├── REACT/            # Frontend (React + Vite)
│   ├── src/
│   ├── public/
│   └── package.json
│
├── start-dev.js      # Script de inicialização
└── package.json      # Configuração raiz
```

## 🔧 Troubleshooting

### Backend não inicia

1. Verifique se `BECKEND/.env` existe e está configurado
2. Certifique-se que a porta 4000 está livre
3. Verifique a conexão com MongoDB

### Frontend não inicia

1. Certifique-se que a porta 5173 está livre
2. Verifique se as dependências foram instaladas

### Ambos não iniciam

Execute:
```bash
cd BECKEND
npm install
cd ../REACT
npm install
```

## 📝 Logs

O script `start-dev.js` exibe logs coloridos:
- 🔵 **BACKEND** (cyan): Logs do servidor Node.js
- 🟣 **FRONTEND** (magenta): Logs do Vite/React

## 🧪 Testes

```bash
# Testes do Backend
npm test

# Testes do gerador de PI
cd BECKEND
node PISystemGen/test-schema-generator.js
```

## 📚 Documentação

- **Backend**: Ver `BECKEND/README.md`
- **Gerador de PI**: Ver `BECKEND/PISystemGen/README.md`
- **Frontend**: Ver `REACT/README.md`

---

**Desenvolvido por:** InMidia Team  
**Versão:** 3.0.0
