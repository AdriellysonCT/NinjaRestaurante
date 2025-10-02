import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { motion } from 'framer-motion';

const ExcelImport = ({ onImport, onClose }) => {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState([]);
  const [preview, setPreview] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  // Template para download
  const downloadTemplate = () => {
    const template = [
      {
        nome: 'X-Burguer',
        descricao: 'Pão, carne, queijo e salada',
        preco: 19.90,
        categoria: 'Lanches',
        imagem_url: 'https://exemplo.com/imagem.jpg',
        tempo_preparo: 15,
        ingredientes: 'Pão,Carne,Queijo,Salada',
        disponivel: 'TRUE',
        especial: 'FALSE'
      },
      {
        nome: 'Coca-Cola',
        descricao: 'Refrigerante 350ml',
        preco: 5.50,
        categoria: 'Bebidas',
        imagem_url: '',
        tempo_preparo: 0,
        ingredientes: '',
        disponivel: 'TRUE',
        especial: 'FALSE'
      },
      {
        nome: 'Pizza Margherita',
        descricao: 'Pizza com molho de tomate, mussarela e manjericão',
        preco: 35.00,
        categoria: 'Pratos Principais',
        imagem_url: '',
        tempo_preparo: 25,
        ingredientes: 'Massa,Molho de tomate,Mussarela,Manjericão',
        disponivel: 'TRUE',
        especial: 'TRUE'
      }
    ];
    
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cardápio');
    XLSX.writeFile(wb, 'template_cardapio.xlsx');
  };

  // Processar arquivo Excel
  const handleFileUpload = (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setErrors([]);
    setPreview([]);
    setShowPreview(false);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: 'binary' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        processExcelData(jsonData);
      } catch (error) {
        setErrors(['Erro ao ler arquivo Excel: ' + error.message]);
      }
    };
    
    reader.readAsBinaryString(selectedFile);
  };

  // Validar e processar dados do Excel
  const processExcelData = (data) => {
    const validItems = [];
    const validationErrors = [];

    data.forEach((row, index) => {
      const lineNumber = index + 2; // +2 porque Excel começa na linha 1 e temos header

      // Validar campos obrigatórios
      if (!row.nome || row.nome.trim() === '') {
        validationErrors.push(`Linha ${lineNumber}: Nome é obrigatório`);
        return;
      }

      if (!row.preco || isNaN(parseFloat(row.preco))) {
        validationErrors.push(`Linha ${lineNumber}: Preço deve ser um número válido`);
        return;
      }

      if (!row.categoria || row.categoria.trim() === '') {
        validationErrors.push(`Linha ${lineNumber}: Categoria é obrigatória`);
        return;
      }

      // Validar preço positivo
      const preco = parseFloat(row.preco);
      if (preco <= 0) {
        validationErrors.push(`Linha ${lineNumber}: Preço deve ser maior que zero`);
        return;
      }

      // Validar tempo de preparo
      const tempoPreparo = parseInt(row.tempo_preparo) || 0;
      if (tempoPreparo < 0) {
        validationErrors.push(`Linha ${lineNumber}: Tempo de preparo não pode ser negativo`);
        return;
      }

      // Validar URL da imagem (se fornecida)
      if (row.imagem_url && row.imagem_url.trim() !== '') {
        try {
          new URL(row.imagem_url);
        } catch {
          validationErrors.push(`Linha ${lineNumber}: URL da imagem inválida`);
          return;
        }
      }

      // Formatar dados
      const item = {
        name: row.nome.trim(),
        description: row.descricao ? row.descricao.trim() : '',
        price: preco,
        category: row.categoria.trim(),
        image: row.imagem_url ? row.imagem_url.trim() : '',
        prepTime: tempoPreparo,
        ingredients: row.ingredientes ? 
          row.ingredientes.split(',').map(ing => ing.trim()).filter(ing => ing !== '') : [],
        available: row.disponivel !== 'FALSE' && row.disponivel !== false,
        featured: row.especial === 'TRUE' || row.especial === true
      };

      validItems.push(item);
    });

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (validItems.length === 0) {
      setErrors(['Nenhum item válido encontrado no arquivo']);
      return;
    }

    setPreview(validItems);
    setShowPreview(true);
  };

  // Importar itens em lote
  const handleImport = async () => {
    if (preview.length === 0) return;

    console.log('Iniciando importação de', preview.length, 'itens');
    setImporting(true);
    setProgress(0);
    setErrors([]);

    try {
      const importErrors = [];
      let successCount = 0;

      // Importar um item por vez para melhor controle
      for (let i = 0; i < preview.length; i++) {
        const item = preview[i];
        
        try {
          console.log(`Importando item ${i + 1}/${preview.length}:`, item.name, item);
          
          // Tentar importar o item
          console.log('Chamando onImport com:', item);
          const result = await onImport(item);
          console.log('Resultado do onImport:', result);
          
          console.log('✅ Item importado com sucesso:', item.name);
          successCount++;
          
        } catch (error) {
          console.error('❌ Erro ao importar item:', item.name, error);
          importErrors.push(`${item.name}: ${error.message}`);
        }

        // Atualizar progresso após cada item
        const currentProgress = ((i + 1) / preview.length) * 100;
        setProgress(currentProgress);
        
        console.log(`Progresso: ${currentProgress.toFixed(0)}% (${i + 1}/${preview.length})`);

        // Pequena pausa entre itens para não sobrecarregar
        if (i < preview.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      console.log(`Importação concluída: ${successCount} sucessos, ${importErrors.length} erros`);

      if (importErrors.length > 0) {
        setErrors([
          `Importação parcial: ${successCount} itens importados, ${importErrors.length} falharam:`,
          ...importErrors
        ]);
      } else {
        // Sucesso total
        console.log('🎉 Todos os itens foram importados com sucesso!');
        setTimeout(() => {
          onClose();
        }, 1500);
      }

    } catch (error) {
      console.error('Erro geral durante a importação:', error);
      setErrors(['Erro durante a importação: ' + error.message]);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Importar Cardápio via Excel</h3>
        <p className="text-sm text-muted-foreground">
          Importe múltiplos itens do cardápio de uma só vez usando um arquivo Excel
        </p>
      </div>

      {/* Download Template */}
      <div className="bg-secondary/20 p-4 rounded-lg">
        <h4 className="font-medium mb-2">📥 Template do Excel</h4>
        <p className="text-sm text-muted-foreground mb-3">
          Baixe o template com exemplos para facilitar a importação
        </p>
        <button 
          onClick={downloadTemplate}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Baixar Template
        </button>
      </div>

      {/* Upload File */}
      <div className="space-y-3">
        <label className="block text-sm font-medium">Selecionar Arquivo Excel</label>
        <input 
          type="file" 
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          className="w-full bg-input px-3 py-2 rounded-md text-sm"
          disabled={importing}
        />
        {file && (
          <p className="text-xs text-muted-foreground">
            Arquivo selecionado: {file.name}
          </p>
        )}
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <h4 className="font-medium text-destructive mb-2">❌ Erros Encontrados:</h4>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {errors.map((error, index) => (
              <p key={index} className="text-sm text-destructive">{error}</p>
            ))}
          </div>
        </div>
      )}

      {/* Preview */}
      {showPreview && preview.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">📋 Preview dos Itens ({preview.length} itens)</h4>
          <div className="bg-secondary/10 rounded-lg p-4 max-h-60 overflow-y-auto">
            <div className="space-y-2">
              {preview.slice(0, 5).map((item, index) => (
                <div key={index} className="flex justify-between items-center text-sm border-b border-border/50 pb-2">
                  <div>
                    <span className="font-medium">{item.name}</span>
                    <span className="text-muted-foreground ml-2">({item.category})</span>
                  </div>
                  <span className="font-medium text-primary">R$ {item.price.toFixed(2)}</span>
                </div>
              ))}
              {preview.length > 5 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  ... e mais {preview.length - 5} itens
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Progress */}
      {importing && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Importando itens...</span>
            <span>{progress.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <motion.div 
              className="bg-primary h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button 
          onClick={onClose}
          disabled={importing}
          className="flex-1 py-2 text-sm font-semibold rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button 
          onClick={handleImport}
          disabled={!showPreview || preview.length === 0 || importing}
          className="flex-1 py-2 text-sm font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {importing ? `Importando... ${progress.toFixed(0)}%` : `Importar ${preview.length} Itens`}
        </button>
      </div>
    </div>
  );
};

export default ExcelImport;