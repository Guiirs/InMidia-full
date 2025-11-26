# Como Usar o Start Dev

## ✅ Método 1: Script Customizado (Atual)

```bash
# Usar script nativo Node.js
npm run dev
```

ou

```bash
node start-dev.js
```

**Vantagens:**
- ✅ Não precisa instalar dependências extras
- ✅ Logs coloridos e bem organizados
- ✅ Encerramento gracioso com Ctrl+C
- ✅ Funciona imediatamente

## 🔄 Método 2: Usando Concurrently (Alternativo)

Se preferir usar a biblioteca `concurrently`:

### 1. Instalar concurrently

```bash
npm install --save-dev concurrently
```

### 2. Atualizar package.json

Adicione em `scripts`:

```json
{
  "scripts": {
    "dev": "node start-dev.js",
    "dev:concurrent": "concurrently \"npm run backend\" \"npm run frontend\"",
    "dev:concurrent:colored": "concurrently -n \"BACKEND,FRONTEND\" -c \"cyan,magenta\" \"npm run backend\" \"npm run frontend\""
  }
}
```

### 3. Usar

```bash
npm run dev:concurrent
```

## 🎨 Diferenças

| Característica | Script Nativo | Concurrently |
|----------------|---------------|--------------|
| Instalação | ❌ Não precisa | ✅ Precisa npm install |
| Logs | ✅ Coloridos | ✅ Coloridos (com flags) |
| Timestamps | ✅ Sim | ❌ Não (por padrão) |
| Encerramento | ✅ Gracioso | ✅ Automático |
| Customização | ✅ Total | ⚠️ Limitada |

## 💡 Recomendação

Use o **método atual (start-dev.js)** - é mais simples e não adiciona dependências desnecessárias.

## 🚀 Comandos Úteis

```bash
# Iniciar tudo
npm run dev

# Apenas Backend
npm run backend

# Apenas Frontend
npm run frontend

# Instalar tudo
npm run install:all

# Testes
npm test
```

## 🛑 Parar os Servidores

Pressione **Ctrl+C** no terminal onde executou `npm run dev`.

O script vai encerrar ambos os servidores automaticamente e de forma segura.

## 📝 Logs

Os logs são exibidos com prefixos coloridos:

```
[09:34:10] [BACKEND] Servidor rodando na porta 4000
[09:34:11] [FRONTEND] Local: http://localhost:5173/
```

- **[BACKEND]** - Mensagens do servidor Node.js (cyan)
- **[FRONTEND]** - Mensagens do Vite/React (magenta)
- **[SYSTEM]** - Mensagens do sistema (yellow)

## ⚡ Performance

O script usa `spawn` nativo do Node.js, que é:
- Leve
- Rápido
- Sem overhead de bibliotecas extras
- Gerenciamento direto de processos

---

**Status**: ✅ Funcionando perfeitamente!
