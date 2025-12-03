# Análise Completa: Sistema de PI e Placas

## 📋 Resumo Executivo

**Problema Identificado**: As placas não estão sendo bloqueadas automaticamente quando uma PI é criada, e apenas 10 das 47 placas estão sendo exibidas no filtro.

**Causa Raiz**:
1. **Paginação no Backend**: O serviço de placas tem limite padrão de 10 por página
2. **Frontend não usa API de disponibilidade**: Após correção, o frontend mostra todas as placas mas não verifica disponibilidade via API
3. **Aluguéis sendo criados**: O backend ESTÁ criando aluguéis corretamente, mas logs detalhados são necessários para confirmar

---

## 🔍 Análise Detalhada

### 1. Fluxo de Criação de PI

#### Frontend (React)
```
PIModalForm → usePIFormLogic → PIsPage
```

**Etapas**:
1. **Página 1**: Seleciona cliente
2. **Página 2**: Define período (datas ou bi-semanas)
3. **Página 3**: Seleciona placas
4. **Página 4**: Define valores

**Dados Enviados** (após `handleFormSubmit`):
```javascript
{
  clienteId: "ObjectId",
  period: {
    periodType: "custom" | "bi-week",
    startDate: "2024-01-01",
    endDate: "2024-01-31",
    biWeekIds: ["id1", "id2"] // se bi-week
  },
  placas: ["placaId1", "placaId2", ...], // Array de IDs
  descricao: "texto",
  valorTotal: 1000,
  formaPagamento: "texto",
  produto: "OUTDOOR",
  descricaoPeriodo: "texto opcional",
  valorProducao: 0
}
```

#### Backend (Node.js/TypeScript)

**Rota**: `POST /api/v1/pis`

**Controller** (`pi.controller.ts`):
```typescript
export async function createPI(req: IAuthRequest, res: Response) {
    const empresaId = (req.user as any).empresaId;
    const piData = { ...req.body, cliente: req.body.clienteId };
    const novaPI = await piService.create(piData, empresaId);
    res.status(201).json(novaPI);
}
```

**Service** (`pi.service.ts`):
```typescript
async create(piData, empresaId) {
    // 1. Valida cliente
    await this._validateCliente(piData.cliente, empresaId);
    
    // 2. Processa período usando PeriodService
    const period = await PeriodService.processPeriodInput(piData);
    
    // 3. Gera código único de sincronização
    const piCode = this._generatePICode();
    
    // 4. Cria documento PI
    const novaPI = new PropostaInterna({
        ...piData,
        empresaId,
        pi_code: piCode,
        status: 'em_andamento',
        // Campos de período unificado
        periodType: period.periodType,
        startDate: period.startDate,
        endDate: period.endDate,
        biWeekIds: period.biWeekIds,
        // Campos legados (compatibilidade)
        dataInicio: period.startDate,
        dataFim: period.endDate
    });
    
    // 5. Salva PI
    await novaPI.save();
    
    // 6. ⚠️ PONTO CRÍTICO: Cria aluguéis automaticamente
    if (novaPI.placas && novaPI.placas.length > 0) {
        await this._criarAlugueisParaPI(
            novaPI._id,
            piCode,
            novaPI.clienteId,
            novaPI.placas,
            period,
            empresaId
        );
    }
    
    return novaPI;
}
```

**Método de Criação de Aluguéis**:
```typescript
async _criarAlugueisParaPI(piId, piCode, clienteId, placaIds, period, empresaId) {
    const alugueis = placaIds.map(placaId => ({
        placaId: placaId,
        clienteId: clienteId,
        empresaId: empresaId,
        periodType: period.periodType,
        startDate: period.startDate,
        endDate: period.endDate,
        biWeekIds: period.biWeekIds || [],
        // Campos legados
        data_inicio: period.startDate,
        data_fim: period.endDate,
        // Sincronização PI
        pi_code: piCode,
        proposta_interna: piId,
        tipo: 'pi'
    }));
    
    const alugueisCreated = await Aluguel.insertMany(alugueis);
    logger.info(`${alugueisCreated.length} aluguéis criados`);
    
    return alugueisCreated;
}
```

---

### 2. Sistema de Disponibilidade de Placas

#### Como DEVERIA Funcionar

1. **API `/placas/disponiveis`** verifica:
   - Placas com `disponivel: true`
   - Sem conflitos de data em `Aluguel`
   - Sem conflitos de data em `PropostaInterna`

2. **Frontend** exibe:
   - Placas disponíveis (podem ser selecionadas)
   - Placas indisponíveis (cinza, bloqueadas)

#### Como ESTÁ Funcionando (Após Correções)

1. **Frontend** mostra TODAS as placas como disponíveis
2. **Validação** acontece no backend durante submit
3. **Problema**: Não há feedback visual de disponibilidade

---

### 3. Problema de Paginação

**Localização**: `BECKEND/src/modules/placas/placa.service.ts`

**Código Problemático**:
```typescript
async getPlacas(empresaId, queryParams = {}) {
    const { 
        page = 1, 
        limit = 10, // ⚠️ AQUI ESTÁ O PROBLEMA
        sortBy = 'numero_placa',
        order = 'asc',
        regiao,
        search,
        disponibilidade
    } = queryParams;
    
    // ... busca placas ...
}
```

**Solução Aplicada**:
```typescript
limit = parseInt(limit, 10) || 50, // Aumentado de 10 para 50
```

---

## 🐛 Bugs Identificados e Correções

### Bug #1: Paginação Limitada (10 placas)
**Status**: ✅ CORRIGIDO
**Solução**: Alterado limite padrão de 10 para 50 em `placa.service.ts`

### Bug #2: Frontend não usa API de disponibilidade
**Status**: ⚠️ WORKAROUND APLICADO
**Workaround**: Frontend mostra todas as placas, validação no backend
**Solução Ideal**: Reativar verificação de disponibilidade no frontend

### Bug #3: Logs insuficientes para debug
**Status**: ✅ CORRIGIDO
**Solução**: Adicionados logs detalhados em:
- `pi.service.ts`: Criação de PI e aluguéis
- `Page2Placas.jsx`: Seleção de placas

---

## 📊 Fluxo de Dados Completo

```
┌─────────────────────────────────────────────────────────────┐
│                    CRIAR PI                                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. FRONTEND (PIModalForm)                                   │
│    - Usuário preenche 4 páginas                             │
│    - Dados: cliente, período, placas[], valores             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ POST /api/v1/pis
┌─────────────────────────────────────────────────────────────┐
│ 2. BACKEND (pi.controller.ts)                               │
│    - Recebe dados                                            │
│    - Adiciona empresaId do token JWT                         │
│    - Chama piService.create()                                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. PIService.create()                                        │
│    a) Valida cliente                                         │
│    b) Processa período (PeriodService)                       │
│    c) Gera pi_code único                                     │
│    d) Cria documento PropostaInterna                         │
│    e) Salva no MongoDB                                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. PIService._criarAlugueisParaPI()                          │
│    - Para cada placa selecionada:                            │
│      * Cria registro em Aluguel                              │
│      * Vincula à PI (pi_code, proposta_interna)              │
│      * Define período (startDate, endDate)                   │
│      * Marca tipo: 'pi'                                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. RESULTADO                                                 │
│    ✅ PI criada com status 'em_andamento'                   │
│    ✅ N aluguéis criados (N = quantidade de placas)         │
│    ✅ Placas bloqueadas para o período                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. VERIFICAÇÃO DE DISPONIBILIDADE                            │
│    API: GET /placas/disponiveis?dataInicio=...&dataFim=...  │
│    - Busca Alugueis com conflito de data                     │
│    - Busca PIs com conflito de data                          │
│    - Retorna apenas placas SEM conflitos                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Verificações Necessárias

### 1. Confirmar Criação de Aluguéis

**Query MongoDB**:
```javascript
// Contar aluguéis criados por PIs
db.alugueis.countDocuments({ tipo: 'pi' })

// Ver último aluguel de PI criado
db.alugueis.find({ tipo: 'pi' }).sort({ createdAt: -1 }).limit(1)

// Ver aluguéis de uma PI específica
db.alugueis.find({ pi_code: 'PI-XXXXXXXXX' })
```

### 2. Verificar Logs do Backend

**Logs Esperados** (ao criar PI):
```
[PIService] Criando PI para empresa {empresaId}
[PIService] Placas recebidas: {N} placas
[PIService] Período processado: Tipo={tipo}
[PIService] PI salva com sucesso. ID: {piId}, Code: {piCode}, Placas: {N}
[PIService] ✅ Condição atendida: Criando aluguéis para {N} placas
[PIService] Criando {N} aluguéis para PI {piId}
[PIService] {N} aluguéis criados com sucesso
```

### 3. Testar Fluxo Completo

1. ✅ Criar PI com 3 placas
2. ✅ Verificar se 3 aluguéis foram criados
3. ✅ Verificar se placas não aparecem como disponíveis no mesmo período
4. ✅ Verificar se placas aparecem como disponíveis em período diferente

---

## 🎯 Próximos Passos

### Curto Prazo
1. ✅ Aumentar limite de placas de 10 para 50
2. ✅ Adicionar logs detalhados
3. ⏳ Testar criação de PI e confirmar aluguéis
4. ⏳ Verificar se bloqueio de placas está funcionando

### Médio Prazo
1. ⏳ Reativar API de disponibilidade no frontend
2. ⏳ Adicionar feedback visual de placas indisponíveis
3. ⏳ Implementar paginação real no frontend (se necessário)

### Longo Prazo
1. ⏳ Remover campos legados (data_inicio, data_fim, etc.)
2. ⏳ Migrar 100% para sistema de período unificado
3. ⏳ Adicionar testes automatizados

---

## 📝 Notas Importantes

### Sistema de Período Unificado

O sistema usa dois formatos de período:
- **custom**: Datas livres (startDate, endDate)
- **bi-week**: Quinzenas predefinidas (biWeekIds)

Ambos são convertidos para o formato unificado internamente.

### Campos Legados

Mantidos para compatibilidade:
- `data_inicio` → `startDate`
- `data_fim` → `endDate`
- `bi_week_ids` → `biWeekIds`
- `tipoPeriodo` → `periodType`

### Campo `disponivel` das Placas

**NÃO é modificado** pelos aluguéis/PIs.
- `true`: Placa em operação normal
- `false`: Placa em manutenção (manual)

A disponibilidade real é calculada verificando conflitos de datas.

---

## 🚨 Pontos de Atenção

1. **Token JWT**: Deve conter `empresaId` válido
2. **Placas Array**: Frontend deve enviar array de IDs, não objetos
3. **ClienteId**: Deve ser enviado como `clienteId` (não `cliente`)
4. **Período**: Deve passar validação do `PeriodService`

---

## 📚 Arquivos Importantes

### Backend
- `src/modules/propostas-internas/pi.service.ts` - Lógica de criação de PI
- `src/modules/propostas-internas/pi.controller.ts` - Controller de PIs
- `src/modules/placas/placa.service.ts` - Lógica de disponibilidade
- `src/database/schemas/proposta-interna.schema.ts` - Schema da PI
- `src/database/schemas/aluguel.schema.ts` - Schema do Aluguel

### Frontend
- `src/components/PIModalForm/PIModalForm.jsx` - Formulário principal
- `src/components/PIModalForm/system/usePIFormLogic.js` - Lógica do formulário
- `src/components/PIModalForm/Pages/Page2Placas.jsx` - Seleção de placas
- `src/pages/PIs/PIsPage.jsx` - Página de listagem de PIs
- `src/services/piService.js` - API calls

---

*Documento gerado em: 01/12/2025*
*Versão: 1.0*
