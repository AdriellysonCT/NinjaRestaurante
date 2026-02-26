# 🌍 Geocoding de Endereço - Latitude e Longitude

## 🎯 Objetivo

Quando o restaurante cadastra/atualiza seu endereço, o sistema:

1. ✅ Salva o endereço nas colunas: `rua`, `numero`, `bairro`, `cidade`, `complemento`
2. ✅ Converte o endereço em coordenadas (latitude/longitude) usando geocoding
3. ✅ Salva as coordenadas nas colunas: `latitude`, `longitude`

## 🔧 Como Funciona

### 1. Usuário Preenche Endereço

```
Rua: Av. Paulista
Número: 1000
Bairro: Bela Vista
Cidade: São Paulo
Complemento: Sala 101
```

### 2. Sistema Monta Endereço Completo

```
"Av. Paulista, 1000, Bela Vista, São Paulo, Brasil"
```

### 3. Chama API de Geocoding (Nominatim)

```javascript
const url = `https://nominatim.openstreetmap.org/search?format=json&q=${enderecoCompleto}&limit=1`;
```

**API Nominatim (OpenStreetMap):**
- ✅ Gratuita
- ✅ Sem necessidade de API key
- ✅ Sem limite de requisições (uso razoável)
- ✅ Dados do OpenStreetMap

### 4. Recebe Coordenadas

```json
{
  "lat": "-23.5613",
  "lon": "-46.6565"
}
```

### 5. Salva Tudo em restaurantes_app

```sql
UPDATE restaurantes_app SET
  rua = 'Av. Paulista',
  numero = '1000',
  bairro = 'Bela Vista',
  cidade = 'São Paulo',
  complemento = 'Sala 101',
  latitude = -23.5613,
  longitude = -46.6565,
  updated_at = NOW()
WHERE id = 'user_id';
```

## 📊 Estrutura das Colunas

```
restaurantes_app:
  ├─ rua (text) - Nome da rua
  ├─ numero (text) - Número
  ├─ bairro (text) - Bairro
  ├─ cidade (text) - Cidade
  ├─ complemento (text) - Complemento (opcional)
  ├─ latitude (numeric) - Coordenada latitude
  └─ longitude (numeric) - Coordenada longitude
```

## 🎯 Uso das Coordenadas

Com latitude e longitude, você pode:

1. **Mostrar no mapa** (Google Maps, OpenStreetMap, etc)
2. **Calcular distância** entre restaurante e cliente
3. **Calcular taxa de entrega** baseada na distância
4. **Mostrar restaurantes próximos** ao cliente
5. **Otimizar rotas** de entrega

## 🧪 Exemplo de Uso

### Salvar Endereço

```javascript
import { atualizarEndereco } from './services/authService';

const endereco = {
  rua: 'Av. Paulista',
  numero: '1000',
  bairro: 'Bela Vista',
  cidade: 'São Paulo',
  complemento: 'Sala 101'
};

const resultado = await atualizarEndereco(endereco);

console.log('Endereço salvo:', resultado);
// {
//   rua: 'Av. Paulista',
//   numero: '1000',
//   bairro: 'Bela Vista',
//   cidade: 'São Paulo',
//   complemento: 'Sala 101',
//   latitude: -23.5613,
//   longitude: -46.6565
// }
```

### Mostrar no Mapa

```javascript
// Google Maps
const url = `https://www.google.com/maps?q=${latitude},${longitude}`;

// OpenStreetMap
const url = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}`;
```

### Calcular Distância

```javascript
function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distancia = R * c; // Distância em km
  return distancia;
}

// Exemplo
const distancia = calcularDistancia(
  -23.5613, -46.6565, // Restaurante
  -23.5505, -46.6333  // Cliente
);
console.log(`Distância: ${distancia.toFixed(2)} km`);
```

## 🔍 Logs do Console

### Sucesso

```
📍 Atualizando endereço do restaurante...
📋 Dados do endereço: { rua: 'Av. Paulista', numero: '1000', ... }
🌍 Buscando coordenadas para: Av. Paulista, 1000, Bela Vista, São Paulo, Brasil
✅ Coordenadas encontradas: { latitude: -23.5613, longitude: -46.6565 }
✅ Endereço atualizado com sucesso: { ... }
✅ Coordenadas salvas: { latitude: -23.5613, longitude: -46.6565 }
```

### Endereço Não Encontrado

```
📍 Atualizando endereço do restaurante...
🌍 Buscando coordenadas para: Rua Inexistente, 999, Bairro Falso, Cidade Falsa, Brasil
⚠️ Nenhuma coordenada encontrada para o endereço
✅ Endereço atualizado com sucesso: { ... }
⚠️ Endereço salvo, mas coordenadas não foram obtidas
```

**Nota:** Mesmo se o geocoding falhar, o endereço é salvo normalmente.

## ⚠️ Tratamento de Erros

### Erro na API de Geocoding

```javascript
// Se a API falhar, continua sem coordenadas
return { latitude: null, longitude: null };
```

**Resultado:** Endereço é salvo, mas `latitude` e `longitude` ficam `null`

### Erro ao Salvar no Banco

```javascript
if (error) {
  console.error('❌ Erro ao atualizar endereço:', error);
  throw error;
}
```

**Resultado:** Erro é lançado e nada é salvo

## 🚀 Melhorias Futuras

### 1. Cache de Coordenadas

```javascript
// Salvar coordenadas em cache para não fazer geocoding toda vez
const cache = new Map();
const chave = `${rua}-${numero}-${cidade}`;

if (cache.has(chave)) {
  return cache.get(chave);
}
```

### 2. Validação de Endereço

```javascript
// Verificar se o endereço é válido antes de salvar
if (!endereco.rua || !endereco.numero || !endereco.cidade) {
  throw new Error('Endereço incompleto');
}
```

### 3. API Alternativa

```javascript
// Usar Google Maps Geocoding API (requer API key)
const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${enderecoCompleto}&key=${API_KEY}`;
```

### 4. Sugestão de Endereço

```javascript
// Usar API de autocomplete para sugerir endereços
const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=5`;
```

## 📚 Referências

- **Nominatim API:** https://nominatim.org/release-docs/latest/api/Search/
- **OpenStreetMap:** https://www.openstreetmap.org/
- **Cálculo de Distância:** https://en.wikipedia.org/wiki/Haversine_formula

---

**Pronto para usar!** 🚀
