# 🧪 GUIA RÁPIDO DE TESTES - Novos Campos PI

## ✅ Como Testar as Alterações

### 1️⃣ Iniciar o Servidor (Se necessário)

**Backend:**
```powershell
cd e:\backstage\BECKEND
npm start
```

**Frontend:**
```powershell
cd e:\backstage\REACT
npm run dev
```

---

## 📋 TESTE 1: Criar Nova PI com Novos Campos

### Passo a Passo:

1. **Acessar a aplicação**
   - Abrir: `http://localhost:5173` (ou porta configurada)
   - Login com usuário válido

2. **Navegar para Propostas Internas**
   - Menu lateral → "Propostas Internas"

3. **Abrir formulário de criação**
   - Botão "Nova PI" ou "Criar PI"

4. **Página 1 - Cliente**
   - Selecionar cliente
   - Preencher descrição: `Teste Novos Campos PDF`
   - Avançar

5. **Página 2 - Placas**
   - Selecionar ao menos 1 placa
   - Avançar

6. **Página 3 - Valores** ⭐
   - **Campos existentes:**
     - Tipo de Período: `Mensal`
     - Valor Total: Digite `500000` (aparecerá como R$ 5.000,00)
     - Forma de Pagamento: `30/60 dias`
   
   - **NOVOS CAMPOS (verificar se aparecem):**
     - **Produto/Tipo:** Digite `OUTDOOR 9x3`
     - **Descrição do Período:** Digite `BISEMANA 26 - Jun/2025`
     - **Valor Produção:** Digite `50000` (aparecerá como R$ 500,00)

7. **Salvar**
   - Clicar em "Criar PI"
   - ✅ **Esperado:** Mensagem de sucesso

8. **Verificar PDF**
   - Clicar no botão de "Baixar PDF" da PI recém-criada
   - ✅ **Esperado:** PDF deve mostrar:
     - Produto: `OUTDOOR 9x3`
     - Período: `BISEMANA 26 - Jun/2025`
     - Valor Produção: `R$ 500,00`
     - Valor Veiculação: `R$ 4.500,00` (5000 - 500)
     - Valor Total: `R$ 5.000,00`

---

## 📋 TESTE 2: Editar PI Antiga (Sem Novos Campos)

### Passo a Passo:

1. **Selecionar PI criada ANTES da atualização**
   - Clicar em "Editar" em uma PI existente

2. **Navegar até Página 3**
   - Avançar pelas páginas 1 e 2

3. **Verificar novos campos**
   - ✅ **Esperado:** 
     - Campo "Produto/Tipo" deve estar vazio ou mostrar placeholder
     - Campo "Descrição do Período" deve estar vazio
     - Campo "Valor Produção" deve mostrar `R$ 0,00`

4. **Preencher novos campos**
   - Produto: `PAINEL LED`
   - Descrição Período: `MENSAL - MARÇO/2025`
   - Valor Produção: `R$ 300,00`

5. **Salvar alterações**
   - ✅ **Esperado:** Atualização bem-sucedida

6. **Baixar PDF**
   - ✅ **Esperado:** PDF atualizado com novos dados

---

## 📋 TESTE 3: Validações

### Teste 3.1: Valor Produção Negativo
1. Página 3 → Campo "Valor Produção"
2. Digitar valor e tentar colocar `-` (sinal negativo)
3. ✅ **Esperado:** Não deve permitir valor negativo
4. Tentar salvar com valor negativo
5. ✅ **Esperado:** Mensagem de erro "O valor não pode ser negativo"

### Teste 3.2: Campos Opcionais Vazios
1. Criar nova PI
2. Deixar todos os novos campos vazios
3. Salvar
4. ✅ **Esperado:** Salvar normalmente
5. Baixar PDF
6. ✅ **Esperado no PDF:**
   - Produto: `OUTDOOR` (default)
   - Descrição Período: Datas formatadas
   - Valor Produção: `R$ 0,00`
   - Valor Veiculação: Igual ao Valor Total

---

## 📋 TESTE 4: Formatação de Valores

### Teste 4.1: Campo Valor Produção
1. Página 3 → "Valor Produção"
2. Digitar sequencialmente: `1`, `0`, `0`, `0`, `0`
3. ✅ **Esperado:** 
   - Após `1`: mostra `R$ 0,01`
   - Após `10`: mostra `R$ 0,10`
   - Após `100`: mostra `R$ 1,00`
   - Após `1000`: mostra `R$ 10,00`
   - Após `10000`: mostra `R$ 100,00`

### Teste 4.2: Cálculo Automático
1. Valor Total: `R$ 5.000,00`
2. Valor Produção: `R$ 1.200,00`
3. Baixar PDF
4. ✅ **Esperado no PDF:**
   - Valor Produção: `R$ 1.200,00`
   - Valor Veiculação: `R$ 3.800,00` (5000 - 1200)
   - Valor Total: `R$ 5.000,00`

---

## 🎨 TESTE 5: Interface Visual

### Checklist Visual:

#### Página 3 do Formulário:
- [ ] Todos os campos alinhados corretamente
- [ ] Labels legíveis e em português
- [ ] Tooltips (textos de ajuda) aparecem abaixo dos campos
- [ ] Campos monetários formatam automaticamente ao digitar
- [ ] Campos desabilitados quando `isSubmitting=true`
- [ ] Mensagens de erro aparecem em vermelho abaixo do campo

#### Tooltips Esperados:
- [ ] "Produto/Tipo" → "Padrão: OUTDOOR"
- [ ] "Descrição do Período" → "Opcional - Aparecerá no PDF"
- [ ] "Valor Produção" → "Separado do valor de veiculação"

---

## 🐛 PROBLEMAS COMUNS E SOLUÇÕES

### ❌ Campos não aparecem no formulário
**Causa:** Cache do navegador  
**Solução:** 
```
1. Ctrl + Shift + R (hard refresh)
2. Ou abrir DevTools → Network → "Disable cache"
```

### ❌ Erro ao salvar PI
**Causa:** Backend não atualizado  
**Solução:**
```powershell
cd e:\backstage\BECKEND
git pull
npm install
npm start
```

### ❌ PDF não mostra novos campos
**Causa:** PI foi criada antes da atualização  
**Solução:**
```
1. Editar a PI
2. Preencher os novos campos
3. Salvar
4. Baixar PDF novamente
```

### ❌ Formatação de valor quebrada
**Causa:** Conflito com outros scripts  
**Solução:**
```
1. Verificar console do navegador (F12)
2. Procurar erros JavaScript
3. Limpar cache e recarregar
```

---

## 📊 RESULTADOS ESPERADOS

### ✅ SUCESSO se:
- [x] Formulário mostra os 3 novos campos na Página 3
- [x] Valores monetários formatam automaticamente (R$)
- [x] Validação impede valores negativos
- [x] PI salva com sucesso (criar e editar)
- [x] PDF gerado mostra todos os novos campos
- [x] Cálculo de Valor Veiculação está correto (Total - Produção)
- [x] PIs antigas editam sem problemas

### ❌ FALHA se:
- [ ] Campos novos não aparecem
- [ ] Erro ao salvar PI
- [ ] PDF não gera
- [ ] Valores não formatam
- [ ] Validações não funcionam
- [ ] Edição de PI antiga quebra o formulário

---

## 📸 SCREENSHOTS ESPERADOS

### Formulário Página 3 (Antes):
```
┌─────────────────────────────────────┐
│ Tipo de Período: [Mensal ▼]        │
│ Data Início: [2025-01-01]          │
│ Data Fim: [2025-01-31]             │
│ Valor Total: [R$ 5.000,00]         │
│ Forma Pagamento: [30/60 dias]     │
└─────────────────────────────────────┘
```

### Formulário Página 3 (Depois - COM NOVOS CAMPOS):
```
┌─────────────────────────────────────┐
│ Tipo de Período: [Mensal ▼]        │
│ Data Início: [2025-01-01]          │
│ Data Fim: [2025-01-31]             │
│ Valor Total: [R$ 5.000,00]         │
│ Forma Pagamento: [30/60 dias]     │
│                                     │
│ ═══ NOVOS CAMPOS ═══               │
│                                     │
│ Produto/Tipo: [OUTDOOR 9x3]       │
│   └ Padrão: OUTDOOR                │
│                                     │
│ Descrição Período: [BISEMANA 26]  │
│   └ Opcional - Aparecerá no PDF    │
│                                     │
│ Valor Produção: [R$ 500,00]       │
│   └ Separado do valor de veiculação│
└─────────────────────────────────────┘
```

---

## 🎉 CONCLUSÃO DO TESTE

Após executar todos os testes:

### ✅ Sistema está pronto se TODOS os testes passaram
### ⚠️ Necessita correção se ALGUM teste falhou

**Documentar qualquer problema encontrado:**
- Descrever o erro
- Passos para reproduzir
- Screenshot (se aplicável)
- Logs do console (F12)

---

**Data:** 07/11/2025  
**Versão:** 1.0
