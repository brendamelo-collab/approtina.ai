import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { loginWithEmail, registerWithEmail } from '../firebase';
import { X, Lock, Mail, Shield, Check, UserPlus, LogIn, User, ChevronLeft } from 'lucide-react';
import { BrandMark, BrandName, FamilyIllustration } from './ui/Brand';

// variant="page": full-screen login shown before the app when nobody is signed in
export const AuthModal: React.FC<{ variant?: 'modal' | 'page' }> = ({ variant = 'modal' }) => {
  const { isAuthModalOpen, setIsAuthModalOpen } = useApp();
  const isPage = variant === 'page';

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Na tela inicial (sem login), primeiro a abertura com "Começar", como na foto
  const [showWelcome, setShowWelcome] = useState(isPage);

  if (!isPage && !isAuthModalOpen) return null;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    if (isRegisterMode && !name.trim()) {
      setErrorMsg('Informe seu nome para criar a conta.');
      return;
    }
    setErrorMsg(null);
    setLoading(true);

    let result;
    if (isRegisterMode) {
      result = await registerWithEmail(email.trim(), password.trim(), name.trim());
    } else {
      result = await loginWithEmail(email.trim(), password.trim());
    }

    setLoading(false);
    if (result.error) {
      setErrorMsg(result.error);
    } else if (result.user) {
      setSuccessMsg(isRegisterMode ? '✓ Conta criada e conectada com sucesso!' : '✓ Login realizado com sucesso!');
      setTimeout(() => {
        setSuccessMsg(null);
        setIsAuthModalOpen(false);
      }, 1200);
    }
  };

  if (isPage && showWelcome) {
    return (
      <div className="min-h-[100dvh] bg-[#FDFBF7] flex flex-col items-center justify-between px-6 pt-14 pb-10 text-center select-none" style={{ backgroundImage: 'linear-gradient(180deg, #FEF8F3 0%, transparent 60%)' }}>
        <div className="flex flex-col items-center">
          <BrandMark className="w-20 h-20" />
          <BrandName className="mt-3 text-[38px]" />
          <p className="mt-1 text-[15px] text-[#8C7A6B] tracking-wide">Organize • Cuide • Evolua</p>
        </div>
        <FamilyIllustration className="w-full max-w-[320px] my-6" />
        <div className="w-full max-w-sm space-y-6">
          <p className="text-[17px] leading-snug text-[#4A3E34] px-4">Sua vida mais leve, com organização e bem-estar.</p>
          <button
            type="button"
            onClick={() => setShowWelcome(false)}
            className="w-full h-14 rounded-full bg-[#B78A58] hover:brightness-95 text-white text-[17px] font-bold shadow-[0_8px_22px_rgba(150,100,60,0.25)] active:scale-[0.99] transition"
          >
            Começar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        isPage
          ? 'min-h-screen flex items-center justify-center bg-[#FDFBF7] p-4'
          : 'fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-in fade-in duration-150'
      }
    >
      <div className={`w-full max-w-md bg-[#FEFCFA] rounded-[26px] p-5 border border-[#EFE8DE]/70 animate-in zoom-in-95 duration-200 ${isPage ? 'shadow-[0_6px_22px_rgba(150,100,60,0.09)]' : 'shadow-2xl'}`}>
        {isPage && (
          <div className="flex flex-col items-center pb-4">
            <BrandMark className="w-12 h-12" />
            <BrandName className="mt-1 text-[26px]" />
          </div>
        )}
        <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DE]">
          <div className="flex items-center gap-2.5">
            {isPage ? (
              <button type="button" onClick={() => setShowWelcome(true)} className="w-9 h-9 rounded-full bg-[#F4EDE2] flex items-center justify-center text-[#5C4F44]" aria-label="Voltar">
                <ChevronLeft className="w-5 h-5" />
              </button>
            ) : (
              <BrandMark className="w-9 h-9" />
            )}
            <div>
              <h2 className="text-base font-bold text-[#2C2C2C]">
                {isRegisterMode ? 'Criar conta no Rotina.ai' : 'Entrar no Rotina.ai'}
              </h2>
              <p className="text-xs text-[#8C7A6B]">Seus dados sincronizados em todos os aparelhos</p>
            </div>
          </div>
          {!isPage && (
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="w-8 h-8 rounded-full bg-[#F4EDE2] hover:bg-[#EAE0D2] flex items-center justify-center text-[#5C4F44]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="py-4 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-[#FDF2EE] border border-[#EAA598] rounded-2xl text-xs text-[#8C3A24] font-semibold">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-[#EEF5EF] border border-[#B7D2B9] rounded-2xl text-xs text-[#2C5230] font-bold flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3">
            {isRegisterMode && (
              <div>
                <label className="block text-xs font-bold text-[#3C3C3C] mb-1">
                  Seu nome
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#8C7A6B] absolute left-4 top-4" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Como você quer ser chamado(a)"
                    className="w-full pl-11 pr-4 bg-[#FAF8F5] border border-[#EFE8DE] rounded-full h-12 text-sm text-[#2C2C2C] focus:outline-none focus:ring-2 focus:ring-[#B78A58]"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-[#3C3C3C] mb-1">
                E-mail
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8C7A6B] absolute left-4 top-4" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-11 pr-4 bg-[#FAF8F5] border border-[#EFE8DE] rounded-full h-12 text-sm text-[#2C2C2C] focus:outline-none focus:ring-2 focus:ring-[#B78A58]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3C3C3C] mb-1">
                Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8C7A6B] absolute left-4 top-4" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 bg-[#FAF8F5] border border-[#EFE8DE] rounded-full h-12 text-sm text-[#2C2C2C] focus:outline-none focus:ring-2 focus:ring-[#B78A58]"
                />
              </div>
            </div>

            <div className="bg-[#F7F2EA] border border-[#E8DFC8] rounded-2xl p-3 flex items-start gap-2 text-[11px] text-[#5C4F44]">
              <Shield className="w-4 h-4 text-[#8C7A6B] shrink-0 mt-0.5" />
              <span>
                Seus dados ficam salvos com segurança na sua conta e só você tem acesso a eles.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-full bg-[#B78A58] hover:brightness-95 text-white text-[15px] font-bold transition-all shadow-sm active:scale-98 flex items-center justify-center gap-2"
            >
              {isRegisterMode ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              <span>{isRegisterMode ? 'Criar conta' : 'Entrar com e-mail'}</span>
            </button>
          </form>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => setIsRegisterMode(!isRegisterMode)}
              className="text-xs text-[#8C7A6B] hover:text-[#5C4F44] font-semibold underline"
            >
              {isRegisterMode ? 'Já tem uma conta? Faça login' : 'Não tem conta? Criar nova conta'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
