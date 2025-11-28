# 🔄 Guia de Refatoração Frontend - Padronização de Campos (camelCase + Suffix)

**Data:** 27/11/2025  
**Versão:** 1.0.0  
**Objetivo:** Alinhar o Frontend (React) com o Backend TypeScript após padronização dos campos do banco de dados.

---

## 📋 Índice

1. [Contexto da Mudança](#contexto)
2. [Mapeamento de Campos (Legado → Novo)](#mapeamento)
3. [Interfaces TypeScript/PropTypes](#interfaces)
4. [Script de Busca e Substituição (Regex)](#regex-script)
5. [Validação Manual Necessária](#validacao-manual)
6. [Checklist de Arquivos Críticos](#checklist)

---

## 🎯 Contexto da Mudança {#contexto}

O Backend foi padronizado para usar **camelCase com sufixos explícitos** em todos os ObjectIds:

| ❌ Padrão Antigo | ✅ Novo Padrão |
|------------------|----------------|
| `empresa`        | `empresaId`    |
| `cliente`        | `clienteId`    |
| `placa`          | `placaId`      |
| `regiao`         | `regiaoId`     |
| `id_empresa`     | `empresaId`    |
| `empresa_id`     | `empresaId`    |

---

## 🗺️ Mapeamento de Campos (Legado → Novo) {#mapeamento}

### **Clientes**
```javascript
// ❌ Antigo
{
  _id: "...",
  nome: "Cliente XYZ",
  empresa: "507f1f77bcf86cd799439011",  // ❌
  id_empresa: "507f1f77bcf86cd799439011" // ❌
}

// ✅ Novo
{
  _id: "...",
  nome: "Cliente XYZ",
  empresaId: "507f1f77bcf86cd799439011"  // ✅
}
```

### **Alugueis**
```javascript
// ❌ Antigo
{
  _id: "...",
  empresa: "...",    // ❌
  cliente: "...",    // ❌
  placa: "...",      // ❌
  data_inicio: "...", // ❌ (ainda suportado como legado)
  data_fim: "..."     // ❌ (ainda suportado como legado)
}

// ✅ Novo
{
  _id: "...",
  empresaId: "...",  // ✅
  clienteId: "...",  // ✅
  placaId: "...",    // ✅
  startDate: "...",  // ✅ (sistema unificado v2.0)
  endDate: "...",    // ✅ (sistema unificado v2.0)
  
  // Campos legados ainda retornados para compatibilidade
  data_inicio: "...", // ⚠️ deprecated (será removido v3.0)
  data_fim: "..."     // ⚠️ deprecated (será removido v3.0)
}
```

### **Placas**
```javascript
// ❌ Antigo
{
  _id: "...",
  numero_placa: "A-101",
  empresa: "...",  // ❌
  regiao: "..."    // ❌
}

// ✅ Novo
{
  _id: "...",
  numero_placa: "A-101",
  empresaId: "...", // ✅
  regiaoId: "..."   // ✅
}
```

### **Propostas Internas (PIs)**
```javascript
// ❌ Antigo
{
  _id: "...",
  empresa: "...",  // ❌
  cliente: "...",  // ❌
  placas: ["..."]  // Array de IDs (mantido)
}

// ✅ Novo
{
  _id: "...",
  empresaId: "...",  // ✅
  clienteId: "...",  // ✅
  placas: ["..."]    // Array de IDs (mantido)
}
```

---

## 🔧 Interfaces TypeScript/PropTypes {#interfaces}

### **Antes (Antigo)**
```typescript
// ❌ src/types/Cliente.ts (exemplo)
export interface Cliente {
  _id: string;
  nome: string;
  cpfCnpj: string;
  empresa: string;      // ❌
  id_empresa?: string;  // ❌
}
```

### **Depois (Novo)**
```typescript
// ✅ src/types/Cliente.ts
export interface Cliente {
  _id: string;
  nome: string;
  cpfCnpj: string;
  empresaId: string;   // ✅
}
```

---

## 🔍 Script de Busca e Substituição (Regex) {#regex-script}

### **Etapa 1: Backup**
```bash
# Sempre faça backup antes!
git add -A
git commit -m "backup: antes da refatoração de campos"
git checkout -b refactor/field-standardization
```

### **Etapa 2: Substituições Automáticas (VSCode)**

Use o Find & Replace do VSCode (`Ctrl+Shift+H`) com as seguintes expressões regulares:

#### **2.1. Substituir `empresa` por `empresaId`**
```regex
# Find:
\b(res\.data\.|response\.|data\.|item\.|doc\.)empresa\b(?!Id)

# Replace:
$1empresaId

# Exemplo de transformação:
# ❌ res.data.empresa
# ✅ res.data.empresaId
```

#### **2.2. Substituir `cliente` por `clienteId`**
```regex
# Find:
\b(res\.data\.|response\.|data\.|item\.|doc\.)cliente\b(?!Id|_nome)

# Replace:
$1clienteId

# Nota: Preserva cliente_nome (campo virtual)
```

#### **2.3. Substituir `placa` por `placaId`**
```regex
# Find:
\b(res\.data\.|response\.|data\.|item\.|doc\.)placa\b(?!Id|s\b)

# Replace:
$1placaId

# Nota: Preserva "placas" (plural)
```

#### **2.4. Substituir `regiao` por `regiaoId`**
```regex
# Find:
\b(res\.data\.|response\.|data\.|item\.)regiao\b(?!Id)

# Replace:
$1regiaoId
```

#### **2.5. Substituir `id_empresa` por `empresaId`**
```regex
# Find:
\bid_empresa\b

# Replace:
empresaId
```

#### **2.6. Substituir `empresa_id` por `empresaId`**
```regex
# Find:
\bempresa_id\b

# Replace:
empresaId
```

### **Etapa 3: Substituições em Interfaces/Types**

Buscar e substituir em arquivos `src/types/**/*.ts` e `src/types/**/*.d.ts`:

```typescript
// ❌ Antes
interface Cliente {
  empresa: string;
  id_empresa?: string;
}

// ✅ Depois
interface Cliente {
  empresaId: string;
}
```

**Comando VSCode:**
1. Abra a pasta `src/types/`
2. `Ctrl+Shift+F` (buscar em arquivos)
3. Busque por: `empresa:\s*string`
4. Substitua por: `empresaId: string`
5. Repita para: `cliente:`, `placa:`, `regiao:`

---

## ⚠️ Validação Manual Necessária {#validacao-manual}

Alguns casos exigem revisão manual:

### **1. Desestruturação de Objetos**
```javascript
// ❌ Antigo
const { empresa, cliente, placa } = aluguel;

// ✅ Novo
const { empresaId, clienteId, placaId } = aluguel;
```

### **2. Parâmetros de Funções**
```javascript
// ❌ Antigo
function criarAluguel(empresa, cliente, placa) {
  return api.post('/alugueis', { empresa, cliente, placa });
}

// ✅ Novo
function criarAluguel(empresaId, clienteId, placaId) {
  return api.post('/alugueis', { empresaId, clienteId, placaId });
}
```

### **3. Filtros e Queries**
```javascript
// ❌ Antigo
const params = new URLSearchParams({ empresa: user.empresa });

// ✅ Novo
const params = new URLSearchParams({ empresaId: user.empresaId });
```

### **4. useState e Variáveis**
```javascript
// ❌ Antigo
const [empresa, setEmpresa] = useState('');

// ✅ Novo
const [empresaId, setEmpresaId] = useState('');
```

### **5. FormData e Inputs**
```javascript
// ❌ Antigo
<input name="empresa" value={formData.empresa} />

// ✅ Novo
<input name="empresaId" value={formData.empresaId} />
```

---

## 📝 Checklist de Arquivos Críticos {#checklist}

Execute este checklist para garantir que todos os arquivos foram atualizados:

### **Services (API Calls)**
- [ ] `src/services/clienteService.js`
- [ ] `src/services/aluguelService.js`
- [ ] `src/services/placaService.js`
- [ ] `src/services/piService.js`
- [ ] `src/services/contratoService.js`
- [ ] `src/services/regiaoService.js`
- [ ] `src/services/userService.js`

**Ações:**
1. Buscar por `.empresa`, `.cliente`, `.placa`, `.regiao`
2. Substituir por `.empresaId`, `.clienteId`, `.placaId`, `.regiaoId`
3. Atualizar parâmetros de funções

### **Components (UI)**
- [ ] `src/components/PIModalForm/**/*.jsx`
- [ ] `src/components/PlacaCard/PlacaCard.jsx`
- [ ] `src/components/AluguelModal/*.jsx`
- [ ] `src/pages/PIs/PIsPage.jsx`
- [ ] `src/pages/Placas/PlacasPage.jsx`
- [ ] `src/pages/Clientes/ClientesPage.jsx`
- [ ] `src/pages/Alugueis/AlugueisPage.jsx`

**Ações:**
1. Verificar props recebidas (ex: `placa.empresa` → `placa.empresaId`)
2. Atualizar estados (`useState`)
3. Corrigir desestruturação

### **Types/Interfaces**
- [ ] `src/types/*.ts`
- [ ] `src/types/*.d.ts`
- [ ] PropTypes em components (se houver)

**Ações:**
1. Substituir `empresa: string` → `empresaId: string`
2. Remover campos duplicados (`id_empresa`, `empresa_id`)

### **Hooks Customizados**
- [ ] `src/hooks/useDebounce.js`
- [ ] `src/hooks/useCurrencyInput.js`
- [ ] `src/components/PIModalForm/system/usePIFormLogic.js`

**Ações:**
1. Verificar se hooks manipulam objetos com campos antigos
2. Atualizar lógica de transformação

### **Utils e Helpers**
- [ ] `src/utils/helpers.js`
- [ ] `src/utils/validator.js`

**Ações:**
1. Buscar por referências a campos legados
2. Atualizar funções de transformação/validação

---

## 🧪 Teste Pós-Refatoração

Após aplicar as mudanças, execute estes testes:

### **1. Teste de Compilação (se TypeScript)**
```bash
npm run type-check
```

### **2. Teste de Execução**
```bash
npm run dev
```

### **3. Checklist Funcional**
- [ ] Login funciona
- [ ] Listagem de Clientes carrega
- [ ] Listagem de Placas carrega
- [ ] Listagem de Alugueis carrega
- [ ] Criação de PI funciona
- [ ] Criação de Aluguel funciona
- [ ] Filtros funcionam (por empresa, cliente, etc.)
- [ ] Edição de registros funciona
- [ ] Console do navegador sem erros de `undefined`

### **4. Verificação de Erros Comuns**

Busque no console do navegador:
```javascript
// Erros típicos após refatoração:
"Cannot read property 'empresa' of undefined"
"empresa is not defined"
"Expected empresaId but got empresa"
```

Se encontrar, localize o arquivo e corrija.

---

## 🔗 Referências Rápidas

### **Backend Endpoints Alterados**
Todos os endpoints agora retornam/esperam campos padronizados:

| Endpoint | Alteração |
|----------|-----------|
| `GET /api/v1/clientes` | Retorna `empresaId` |
| `POST /api/v1/clientes` | Espera `empresaId` no body |
| `GET /api/v1/alugueis` | Retorna `empresaId`, `clienteId`, `placaId` |
| `POST /api/v1/alugueis` | Espera campos novos |
| `GET /api/v1/placas` | Retorna `empresaId`, `regiaoId` |
| `POST /api/v1/pis` | Espera `empresaId`, `clienteId` |

### **Compatibilidade Retroativa**

O Backend **ainda retorna campos legados** como virtuals para compatibilidade temporária:

```javascript
// Resposta atual do Backend (v2.0)
{
  empresaId: "...",    // ✅ Novo
  empresa: "...",      // ⚠️ Virtual (legado) - será removido v3.0
  id_empresa: "...",   // ⚠️ Virtual (legado) - será removido v3.0
}
```

**⚠️ IMPORTANTE:**  
- Use apenas `empresaId` no frontend
- Campos legados serão **removidos na v3.0**
- Não confie em `empresa` ou `id_empresa`

---

## 📚 Script PowerShell para Substituição em Lote

Se preferir automatizar via PowerShell:

```powershell
# Substitui empresa por empresaId em todos os .js/.jsx
Get-ChildItem -Path "src" -Recurse -Include *.js,*.jsx,*.ts,*.tsx | 
  ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $newContent = $content `
      -replace '\b([\w\.]+)\.empresa\b(?!Id)', '$1.empresaId' `
      -replace '\b([\w\.]+)\.cliente\b(?!Id|_nome)', '$1.clienteId' `
      -replace '\b([\w\.]+)\.placa\b(?!Id|s\b)', '$1.placaId' `
      -replace '\b([\w\.]+)\.regiao\b(?!Id)', '$1.regiaoId' `
      -replace '\bid_empresa\b', 'empresaId' `
      -replace '\bempresa_id\b', 'empresaId'
    
    if ($content -ne $newContent) {
      Set-Content -Path $_.FullName -Value $newContent
      Write-Host "✅ Atualizado: $($_.FullName)" -ForegroundColor Green
    }
  }

Write-Host "`n✅ Refatoração concluída!" -ForegroundColor Green
Write-Host "⚠️ Execute testes manuais antes de commitar." -ForegroundColor Yellow
```

**USO:**
1. Salve como `refactor-fields.ps1`
2. Execute no diretório raiz do frontend:
   ```powershell
   .\refactor-fields.ps1
   ```

---

## ✅ Conclusão

Após seguir este guia:

1. ✅ Todos os campos estarão no padrão `empresaId`, `clienteId`, etc.
2. ✅ Interfaces TypeScript alinhadas com Backend
3. ✅ Compatibilidade com Backend v2.0+
4. ✅ Preparado para remoção de campos legados (v3.0)

**Próximos Passos:**
1. Executar migração do banco (`npm run migrate:fields`)
2. Aplicar refatoração no Frontend (este guia)
3. Testar integração completa
4. Remover campos legados do Backend (v3.0)

---

**Última Atualização:** 27/11/2025  
**Versão do Guia:** 1.0.0  
**Compatível com:** Backend v2.0+, React 18+
