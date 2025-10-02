export const initialOrders = [
  { 
    id: 1, 
    customerName: 'Naruto Uzumaki', 
    items: [{ name: 'Ramen do Ichiraku', qty: 2 }], 
    total: 50.00, 
    status: 'new', 
    prepTime: 600, 
    isVip: true, 
    timestamp: Date.now() - 120000 
  },
  { 
    id: 2, 
    customerName: 'Sasuke Uchiha', 
    items: [{ name: 'Onigiri', qty: 3 }, { name: 'Chá Verde', qty: 1 }], 
    total: 35.50, 
    status: 'new', 
    prepTime: 480, 
    isVip: false, 
    timestamp: Date.now() - 60000 
  },
  { 
    id: 3, 
    customerName: 'Sakura Haruno', 
    items: [{ name: 'Salada Ninja', qty: 1 }], 
    total: 25.00, 
    status: 'preparing', 
    prepTime: 300, 
    isVip: false, 
    timestamp: Date.now() - 300000 
  },
  { 
    id: 4, 
    customerName: 'Kakashi Hatake', 
    items: [{ name: 'Peixe Grelhado', qty: 1 }], 
    total: 42.00, 
    status: 'ready', 
    prepTime: 720, 
    isVip: true, 
    timestamp: Date.now() - 900000 
  },
];

export const topProducts = [
  { name: 'Ramen do Ichiraku', sales: 120 },
  { name: 'Peixe Grelhado', sales: 85 },
  { name: 'Onigiri', sales: 70 },
];