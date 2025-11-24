# ✅ Checklist Rápido: Grupos não aparecem

## 🎯 Problema
Grupos não aparecem na aba "Complementos" do cardápio.

---

## ⚡ Solução em 3 Passos

### 1️⃣ Verificar Associações (SQL)
```sql
SELECT COUNT(*) FROM grupos_complementos_itens;
```
- **Se = 0:** ❌ Problema encontrado!
- **Se > 0:** ✅ OK

### 2️⃣ Associar Complementos (Interface)
```
Complementos > Grupos > Gerenciar Complementos
├─ 🔍 Buscar complemento
├─ ☑ Marcar complementos
└─ Fechar (salva automaticamente)
```

### 3️⃣ Recarregar e Testar
```
Ctrl + Shift + R
↓
Cardápio > Editar Item > Complementos
↓
✅ Grupos aparecem!
```

---

## 🔍 Diagnóstico Rápido

Execute no Supabase:
```sql
-- Arquivo: verificacao_rapida_grupos.sql
SELECT 
    g.nome as grupo,
    COUNT(gci.id) as complementos
FROM grupos_complementos g
LEFT JOIN grupos_complementos_itens gci ON g.id = gci.id_grupo
GROUP BY g.id, g.nome;
```

**Resultado esperado:**
```
grupo       | complementos
------------|-------------
Molhos      | 3
Adicionais  | 5
Bordas      | 2
```

**Se todos = 0:** Você precisa associar!

---

## 🚀 Solução SQL Rápida

Se tiver grupos e complementos mas sem associações:

```sql
-- Associar todos ao primeiro grupo
INSERT INTO grupos_complementos_itens (id_grupo, id_complemento)
SELECT 
    (SELECT id FROM grupos_complementos LIMIT 1),
    id
FROM complementos;
```

---

## 📋 Checklist

- [ ] Grupos criados?
- [ ] Complementos criados?
- [ ] **Complementos associados aos grupos?** ← IMPORTANTE!
- [ ] Cache limpo?
- [ ] Testou no cardápio?

---

## 💡 Lembre-se

**O passo mais esquecido:**
```
Complementos > Grupos > Gerenciar Complementos
```

Sem isso, os grupos ficam vazios!

---

## 🎯 Teste Rápido

1. Crie 1 grupo
2. Crie 1 complemento
3. Associe (Gerenciar Complementos)
4. Teste no cardápio

Se funcionar = problema era falta de associação!
