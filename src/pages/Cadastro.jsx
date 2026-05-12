import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export function Cadastro() {
  const [formData, setFormData] = useState({
    nomeFantasia: '',
    tipoRestaurante: '',
    cnpj: '',
    telefone: '',
    email: '',
    nomeResponsavel: '',
    efiPayeeCode: '',
    senha: '',
    confirmaSenha: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [cadastroSucesso, setCadastroSucesso] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  
  const { cadastrar } = useAuth();
  const navigate = useNavigate();
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Formatação para CNPJ
    if (name === 'cnpj') {
      const cnpjFormatado = formatarCNPJ(value);
      setFormData({ ...formData, [name]: cnpjFormatado });
      return;
    }
    
    // Formatação para telefone
    if (name === 'telefone') {
      const telefoneFormatado = formatarTelefone(value);
      setFormData({ ...formData, [name]: telefoneFormatado });
      return;
    }
    
    setFormData({ ...formData, [name]: value });
  };
  
  const formatarCNPJ = (cnpj) => {
    // Remove caracteres não numéricos
    cnpj = cnpj.replace(/\D/g, '');
    
    // Limita a 14 dígitos
    cnpj = cnpj.slice(0, 14);
    
    // Aplica a máscara
    if (cnpj.length > 12) {
      cnpj = cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    } else if (cnpj.length > 8) {
      cnpj = cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d+)/, '$1.$2.$3/$4');
    } else if (cnpj.length > 5) {
      cnpj = cnpj.replace(/(\d{2})(\d{3})(\d+)/, '$1.$2.$3');
    } else if (cnpj.length > 2) {
      cnpj = cnpj.replace(/(\d{2})(\d+)/, '$1.$2');
    }
    
    return cnpj;
  };
  
  const formatarTelefone = (telefone) => {
    // Remove caracteres não numéricos
    telefone = telefone.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    telefone = telefone.slice(0, 11);
    
    // Aplica a máscara
    if (telefone.length > 10) {
      telefone = telefone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (telefone.length > 6) {
      telefone = telefone.replace(/(\d{2})(\d{4})(\d+)/, '($1) $2-$3');
    } else if (telefone.length > 2) {
      telefone = telefone.replace(/(\d{2})(\d+)/, '($1) $2');
    }
    
    return telefone;
  };
  
  const validarFormulario = () => {
    // Validar campos obrigatórios
    if (!formData.nomeFantasia || !formData.tipoRestaurante || !formData.cnpj || 
        !formData.telefone || !formData.email || !formData.senha || 
        !formData.confirmaSenha || !formData.nomeResponsavel) {
      setErro('Por favor, preencha todos os campos');
      return false;
    }
    
    // Validar CNPJ (apenas formato)
    const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
    if (!cnpjRegex.test(formData.cnpj)) {
      setErro('CNPJ inválido');
      return false;
    }
    
    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErro('Email inválido');
      return false;
    }
    
    // Validar senha
    if (formData.senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres');
      return false;
    }
    
    // Confirmar senha
    if (formData.senha !== formData.confirmaSenha) {
      setErro('As senhas não coincidem');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }
    
    try {
      setLoading(true);
      setErro('');
      
      const resultado = await cadastrar(
        {
          nomeFantasia: formData.nomeFantasia,
          tipoRestaurante: formData.tipoRestaurante,
          cnpj: formData.cnpj,
          telefone: formData.telefone,
          email: formData.email,
          nomeResponsavel: formData.nomeResponsavel,
          efiPayeeCode: formData.efiPayeeCode,
          
        },
        formData.senha
      );
      
      // Verificar se o cadastro requer confirmação de email
      if (resultado.emailConfirmationRequired) {
        setCadastroSucesso(true);
        setMensagemSucesso('Cadastro realizado com sucesso! Por favor, verifique seu email para confirmar sua conta antes de fazer login.');
      } else {
        // Cadastro completo sem problemas
        setCadastroSucesso(true);
        setMensagemSucesso('Cadastro realizado com sucesso! Você já pode fazer login.');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (error) {
      console.error('Erro ao cadastrar:', error);
      setErro(error.message || 'Erro ao cadastrar. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-background to-background/95 flex flex-col items-center py-8 md:justify-center px-4 overflow-y-auto">
      {/* Botão Voltar flutuante para Mobile */}
      <div className="w-full max-w-2xl mb-4">
        <Link to="/login" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="m15 18-6-6 6-6"/></svg>
          Voltar para o login
        </Link>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-2xl p-6 md:p-10 space-y-8 bg-card/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl mb-12"
      >
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <span className="text-3xl">🥷</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-primary uppercase tracking-tighter">Fome Ninja</h1>
          <p className="mt-2 text-muted-foreground font-medium">Cadastre seu restaurante e entre para o clã</p>
        </div>
        
        {cadastroSucesso ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-md"
          >
            <p className="text-center font-medium">{mensagemSucesso}</p>
            <div className="mt-4 text-center">
              <Link 
                to="/login" 
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
              >
                Ir para o Login
              </Link>
            </div>
          </motion.div>
        ) : (
          <>
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              {erro && (
                <div className="p-3 bg-destructive/20 border border-destructive text-destructive text-sm rounded">
                  {erro}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="nomeFantasia" className="block text-sm font-medium text-foreground">
                    Nome do Restaurante*
                  </label>
                  <input
                    id="nomeFantasia"
                    name="nomeFantasia"
                    type="text"
                    required
                    value={formData.nomeFantasia}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 bg-background border border-input rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    placeholder="Nome do seu estabelecimento"
                  />
                </div>
                
                <div>
                  <label htmlFor="tipoRestaurante" className="block text-sm font-medium text-foreground">
                    Tipo de Restaurante*
                  </label>
                  <input
                    id="tipoRestaurante"
                    name="tipoRestaurante"
                    type="text"
                    required
                    value={formData.tipoRestaurante}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 bg-background border border-input rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    placeholder="Ex: Pizzaria, Hamburgueria"
                  />
                </div>
                
                <div>
                  <label htmlFor="cnpj" className="block text-sm font-medium text-foreground">
                    CNPJ*
                  </label>
                  <input
                    id="cnpj"
                    name="cnpj"
                    type="text"
                    required
                    value={formData.cnpj}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 bg-background border border-input rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                
                <div>
                  <label htmlFor="telefone" className="block text-sm font-medium text-foreground">
                    Telefone*
                  </label>
                  <input
                    id="telefone"
                    name="telefone"
                    type="text"
                    required
                    value={formData.telefone}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 bg-background border border-input rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    placeholder="(00) 00000-0000"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground">
                    Email*
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 bg-background border border-input rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    placeholder="seu@email.com"
                  />
                </div>
                
                <div>
                  <label htmlFor="nomeResponsavel" className="block text-sm font-medium text-foreground">
                    Nome do Responsável*
                  </label>
                  <input
                    id="nomeResponsavel"
                    name="nomeResponsavel"
                    type="text"
                    required
                    value={formData.nomeResponsavel}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 bg-background border border-input rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    placeholder="Nome da pessoa responsável pelo restaurante"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="efiPayeeCode" className="text-sm font-medium text-foreground flex items-center gap-2">
                    Efi Payee Code
                    <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded uppercase font-bold">Split de Pagamento</span>
                  </label>
                  <input
                    id="efiPayeeCode"
                    name="efiPayeeCode"
                    type="text"
                    value={formData.efiPayeeCode}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 bg-background border border-input rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    placeholder="Código do favorecido na Efi"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Este código identifica sua conta na Efi para recebimento automático via split. Você encontra este código no painel da Efi.
                  </p>
                </div>
                
                                <div>
                  <label htmlFor="senha" className="block text-sm font-medium text-foreground">
                    Senha*
                  </label>
                  <input
                    id="senha"
                    name="senha"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.senha}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 bg-background border border-input rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                
                <div>
                  <label htmlFor="confirmaSenha" className="block text-sm font-medium text-foreground">
                    Confirmar Senha*
                  </label>
                  <input
                    id="confirmaSenha"
                    name="confirmaSenha"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.confirmaSenha}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 bg-background border border-input rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    placeholder="Confirme sua senha"
                  />
                </div>
              </div>
              
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-4 px-4 border-b-4 border-black/20 rounded-xl shadow-lg text-base font-black uppercase tracking-widest text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-all active:scale-[0.98]"
                >
                  {loading ? 'Preparando Cozinha...' : 'Cadastrar Restaurante'}
                </button>
              </div>
            </form>
            
            <div className="text-center mt-4">
              <p className="text-sm text-muted-foreground">
                Já tem uma conta?{' '}
                <Link to="/login" className="font-medium text-primary hover:text-primary/80">
                  Faça login
                </Link>
              </p>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}