import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { loginWithEmail, registerWithEmail } from '../firebase';
import { X, Lock, Mail, Shield, Check, UserPlus, LogIn, User } from 'lucide-react';

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

  return (
    <div
      className={
        isPage
          ? 'min-h-screen flex items-center justify-center bg-[#FDFBF7] p-4'
          : 'fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-in fade-in duration-150'
      }
    >
      <div className="w-full max-w-md bg-[#FDFBF7] rounded-3xl p-5 shadow-2xl border border-[#EFE8DE] animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DE]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F4EDE2] flex items-center justify-center text-[#B78A58]">
              <Lock className="w-5 h-5 text-[#8C7A6B]" />
            </div>
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
                  <User className="w-4 h-4 text-[#8C7A6B] absolute left-3 top-3.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Como você quer ser chamado(a)"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#FAF8F5] border border-[#EFE8DE] rounded-2xl text-xs text-[#2C2C2C] focus:outline-none focus:ring-2 focus:ring-[#8C7A6B]"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-[#3C3C3C] mb-1">
                E-mail
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8C7A6B] absolute left-3 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#FAF8F5] border border-[#EFE8DE] rounded-2xl text-xs text-[#2C2C2C] focus:outline-none focus:ring-2 focus:ring-[#8C7A6B]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3C3C3C] mb-1">
                Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8C7A6B] absolute left-3 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#FAF8F5] border border-[#EFE8DE] rounded-2xl text-xs text-[#2C2C2C] focus:outline-none focus:ring-2 focus:ring-[#8C7A6B]"
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
              className="w-full py-3 rounded-2xl bg-[#8C7A6B] hover:bg-[#786657] text-white text-xs font-bold transition-all shadow-sm active:scale-98 flex items-center justify-center gap-2"
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
