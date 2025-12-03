# Backstage Full Stack Application

Este projeto contém tanto o backend (Node.js/TypeScript) quanto o frontend (React/Vite) da aplicação Backstage, containerizados com Docker Compose.

## Pré-requisitos

- Docker
- Docker Compose

## Como executar

1. **Clone o repositório:**
   ```bash
   git clone <repository-url>
   cd backstage
   ```

2. **Configure as variáveis de ambiente:**
   ```bash
   cp BECKEND/.env.example BECKEND/.env
   # Edite BECKEND/.env com suas configurações
   ```

3. **Execute a aplicação:**
   ```bash
   # Construir e executar todos os serviços
   docker-compose up --build

   # Ou executar em background
   docker-compose up -d --build
   ```

4. **Acesse a aplicação:**
   - **Frontend:** http://localhost:3000
   - **Backend API:** http://localhost:4000
   - **API Documentation:** http://localhost:4000/api/v1/docs

## Serviços

- **backend**: API Node.js/TypeScript (porta 4000)
- **frontend**: Aplicação React/Vite (porta 3000)
- **mongo**: Banco de dados MongoDB (porta 27017)
- **redis**: Cache Redis (porta 6379)

## Comandos úteis

```bash
# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose down

# Limpar volumes (remove dados)
docker-compose down -v

# Reconstruir apenas um serviço
docker-compose up --build backend
```

## Desenvolvimento

Para desenvolvimento local sem Docker:

```bash
# Backend
cd BECKEND
npm install
npm run dev

# Frontend (em outro terminal)
cd REACT
npm install
npm run dev
```