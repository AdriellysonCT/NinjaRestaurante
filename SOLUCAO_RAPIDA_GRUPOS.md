# ⚡ Solução Rápida: Grupos não aparecem

## 🎯 Problema
Grupos não aparecem na aba "Complementos" do item do cardápio.

## ✅ Solução em 3 Passos

### 1️⃣ Recarregue a Página
```
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

### 2️⃣ Associe Complementos aos Grupos
```
Complementos > Aba "Grupos" > Gerenciar Complementos
├─ Selecione um grupo
├─ Marque os complementos
└─ Salve
```

### 3️⃣ Teste no Cardápio
```
Cardápio > Editar Item > Aba "Complementos"
└─ Os grupos devem aparecer agora!
```

---

## 🔍 Diagnóstico

Execute no Supabase SQL Editor:
```sql
-- Ver se há associações
SELECT 
    g.nome as grupo,
    COUNT(gci.id) as total_complementos
FROM grupos_complementos g
LEFT JOIN grupos_complementos_itens gci ON g.id = gci.id_grupo
GROUP BY g.id, g.nome;
```

**Se `total_complementos = 0`:** Você precisa associar complementos aos grupos!

---

## 📋 Checklist Rápido

- [ ] Grupos criados? (Complementos > Grupos)
- [ ] Complementos criados? (Complementos > Complementos)
- [ ] Complementos associados aos grupos? (Gerenciar Complementos)
- [ ] Página recarregada? (Ctrl + Shift + R)
- [ ] Testou no cardápio? (Editar Item > Complementos)

---

## 🎯 Fluxo Correto

```
1. Criar Grupos
   └─ Complementos > Grupos > Criar Grupo

2. Criar Complementos
   └─ Complementos > Complementos > Criar Complemento

3. Associar Complementos aos Grupos ← IMPORTANTE!
   └─ Complementos > Grupos > Gerenciar Complementos

4. Usar no Cardápio
   └─ Cardápio > Editar Item > Complementos
```

---

## 💡 Dica

O passo 3 (Associar) é o mais esquecido!
Sem ele, os grupos ficam vazios e não aparecem no cardápio.

---

## 🚀 Pronto!

Agora os grupos devem aparecer no cardápio! 🎉
