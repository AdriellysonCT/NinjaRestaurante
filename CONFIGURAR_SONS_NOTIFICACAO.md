# 🔔 Configuração de Sons de Notificação

## 🎯 O que foi implementado

O sistema agora usa **3 sons específicos** para cada tipo de pedido:

| Tipo de Pedido | Arquivo de Som | Quando Toca |
|----------------|----------------|-------------|
| **Entrega** | `som_entrega.wav` | Pedido para entrega em domicílio |
| **Retirada** | `som_retirada.wav` | Pedido para retirar no balcão |
| **Consumo no Local** | `som_consumo_local.wav` | Pedido para consumir no restaurante |

**Não há mais som padrão!** Cada tipo de pedido toca seu som específico.

## 📁 Onde colocar os arquivos de som

Os arquivos devem ser colocados na pasta:
```
meu-fome-ninja/public/sounds/
```

### Estrutura esperada:
```
public/
└── sounds/
    ├── som_entrega.wav          ← OBRIGATÓRIO
    ├── som_retirada.wav         ← OBRIGATÓRIO
    └── som_consumo_local.wav    ← OBRIGATÓRIO
```

**Nota:** O arquivo `Notificação_Pedidos.wav` antigo pode ser removido ou mantido como backup.

## 🎵 Especificações dos arquivos

### Formato recomendado:
- **Formato:** WAV ou MP3
- **Duração:** 1-3 segundos
- **Qualidade:** 44.1kHz, 16-bit
- **Tamanho:** Máximo 500KB cada

### Dicas para escolher os sons:
- **Entrega:** Som mais urgente/rápido (ex: sino, campainha)
- **Retirada:** Som moderado (ex: bip, notificação)
- **Consumo Local:** Som suave (ex: sino de mesa, chime)

## 🔧 Como funciona

### Código implementado:

```javascript
// Função que toca o som correto baseado no tipo
const tocarSomPorTipo = (tipoPedido) => {
  switch (tipoPedido?.toLowerCase()) {
    case 'entrega':
    case 'delivery':
      // Toca som_entrega.wav
      break;
    case 'retirada':
    case 'pickup':
      // Toca som_retirada.wav
      break;
    case 'local':
    case 'consumo_local':
    case 'mesa':
      // Toca som_consumo_local.wav
      break;
    default:
      // Toca Notificação_Pedidos.wav (padrão)
  }
};
```

### Tipos de pedido reconhecidos:

| Campo no Banco | Som Tocado |
|----------------|------------|
| `entrega`, `delivery` | som_entrega.wav |
| `retirada`, `pickup`, `retirar` | som_retirada.wav |
| `local`, `consumo_local`, `mesa`, `dine_in` | som_consumo_local.wav |
| Qualquer outro | Notificação_Pedidos.wav |

## 📊 Logs no Console

Quando um pedido chega, você verá no console:

```
🔔 Tocando som de ENTREGA
```
ou
```
🔔 Tocando som de RETIRADA
```
ou
```
🔔 Tocando som de CONSUMO NO LOCAL
```
ou
```
🔔 Tocando som PADRÃO (tipo não identificado: xxx)
```

## 🧪 Como testar

### 1. Adicionar os arquivos de som
Coloque os 3 arquivos na pasta `public/sounds/`

### 2. Reiniciar o servidor
```bash
npm run dev
```

### 3. Criar pedidos de teste
Crie pedidos com diferentes tipos:
- Um pedido com `tipo_entrega = 'entrega'`
- Um pedido com `tipo_entrega = 'retirada'`
- Um pedido com `tipo_entrega = 'local'`

### 4. Verificar os sons
Cada tipo deve tocar um som diferente!

## ⚠️ Fallback

Se um arquivo de som não existir ou não carregar:
- O sistema usa o som padrão (`Notificação_Pedidos.wav`)
- Não há erro, apenas um fallback silencioso

## 🎨 Personalização

### Trocar um som:
1. Substitua o arquivo na pasta `public/sounds/`
2. Mantenha o mesmo nome
3. Recarregue a página

### Adicionar mais tipos:
Edite a função `tocarSomPorTipo` em `src/context/AppContext.jsx`

## 📁 Arquivos modificados

1. **`src/context/AppContext.jsx`**
   - Adicionadas refs para os 3 tipos de som
   - Criada função `tocarSomPorTipo()`
   - Adicionados elementos `<audio>` para cada tipo
   - Atualizada lógica de tocar som no INSERT

## ✅ Checklist

- [ ] Criar arquivo `som_entrega.wav`
- [ ] Criar arquivo `som_retirada.wav`
- [ ] Criar arquivo `som_consumo_local.wav`
- [ ] Colocar na pasta `public/sounds/`
- [ ] Testar cada tipo de pedido
- [ ] Verificar logs no console

## 🎉 Pronto!

Após adicionar os arquivos de som, o sistema tocará automaticamente o som correto para cada tipo de pedido!

## 📞 Suporte

Se os sons não tocarem:
1. Verifique se os arquivos estão na pasta correta
2. Verifique se os nomes estão corretos
3. Verifique o console (F12) para erros
4. Certifique-se de que o som está habilitado no painel
