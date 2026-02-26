# 📍 Instruções - Endereço Separado em Campos

## 🎯 **Objetivo:**
Dividir o campo "Endereço" atual em campos separados (rua, número, bairro, cidade) e permitir UPDATE nas colunas que estão vazias.

## 🔧 **Passos para Implementar:**

### **1. Verificar Estrutura Atual**
Execute no SQL Editor do Supabase:
```sql
-- Verificar estrutura da tabela restaurantes_app
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'restaurantes_app'
ORDER BY ordinal_position;
```

### **2. Adicionar Colunas de Endereço (se necessário)**
Execute o script `ajustar_tabela_restaurantes.sql` ou diretamente:
```sql
-- Adicionar colunas de endereço separadas
ALTER TABLE restaurantes_app 
ADD COLUMN IF NOT EXISTS rua TEXT,
ADD COLUMN IF NOT EXISTS numero TEXT,
ADD COLUMN IF NOT EXISTS bairro TEXT,
ADD COLUMN IF NOT EXISTS cidade TEXT,
ADD COLUMN IF NOT EXISTS complemento TEXT,
ADD COLUMN IF NOT EXISTS cep TEXT,
ADD COLUMN IF NOT EXISTS estado TEXT;
```

### **3. Testar a Interface**
1. Acesse a página de **Configurações**
2. Vá para a aba **"Geral"**
3. Encontre a seção **"Endereço Detalhado"**
4. Clique em **"Editar"**
5. Preencha os campos separados
6. Clique em **"Salvar Endereço"**

## ✅ **Funcionalidades Implementadas:**

### **Interface de Usuário:**
- ✅ Seção "Endereço Detalhado" na página de configurações
- ✅ Modo de visualização (mostra dados salvos)
- ✅ Modo de edição (formulário com campos separados)
- ✅ Validação (campos obrigatórios: rua, número, bairro, cidade)
- ✅ Botões "Editar", "Salvar" e "Cancelar"

### **Campos Disponíveis:**
- 🏠 **Rua** (obrigatório)
- 🔢 **Número** (obrigatório)  
- 🏘️ **Bairro** (obrigatório)
- 🏙️ **Cidade** (obrigatório)
- 📦 **Complemento** (opcional)
- 📮 **CEP** (opcional - futuro)
- 🗺️ **Estado** (opcional - futuro)

### **Backend:**
- ✅ Função `buscarEnderecoAtivo()` - busca endereço atual
- ✅ Função `atualizarEndereco()` - salva novos dados
- ✅ Integração com tabela `restaurantes_app`
- ✅ Validação de usuário autenticado

## 🎨 **Layout Responsivo:**
- **Desktop**: Campos organizados em grid (2 colunas)
- **Mobile**: Campos empilhados (1 coluna)
- **Visual**: Bordas, espaçamento e cores consistentes

## 🔄 **Fluxo de Uso:**

1. **Visualizar**: Usuário vê endereço atual ou "Nenhum endereço cadastrado"
2. **Editar**: Clica em "Editar" → formulário aparece com dados atuais
3. **Preencher**: Completa os campos obrigatórios
4. **Salvar**: Botão só fica ativo quando campos obrigatórios estão preenchidos
5. **Confirmar**: Dados são salvos no banco e interface volta ao modo visualização

## 🚨 **Importante:**
- Os dados são salvos na tabela `restaurantes_app` (não `configuracoes`)
- É um **UPDATE** nas colunas existentes, não INSERT
- Campos obrigatórios têm validação visual
- Interface responsiva para mobile e desktop

## 🧪 **Para Testar:**
1. Execute os scripts SQL
2. Acesse Configurações → Geral
3. Teste editar e salvar endereço
4. Verifique se os dados aparecem corretamente no banco

**A funcionalidade está 100% implementada e pronta para uso!** 🎉