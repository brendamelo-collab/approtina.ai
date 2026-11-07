import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { loginWithGoogle, loginWithEmail, registerWithEmail } from '../firebase';
import { X, Lock, Mail, Shield, Check, UserPlus, LogIn } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen } = useApp();

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setLoading(true);
    const { user, error } = await loginWithGoogle();
    setLoading(false);
    if (error) {
      setErrorMsg(error);
    } else if (user) {
      setSuccessMsg(`✓ Conectado com sucesso como ${user.email}!`);
      setTimeout(() => {
        setSuccessMsg(null);
        setIsAuthModalOpen(false);
      }, 1200);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setErrorMsg(null);
    setLoading(true);

    let result;
    if (isRegisterMode) {
      result = await registerWithEmail(email.trim(), password.trim());
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#FDFBF7] rounded-3xl p-5 shadow-2xl border border-[#EFE8DE] animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DE]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F4EDE2] flex items-center justify-center text-[#B78A58]">
              <Lock className="w-5 h-5 text-[#8C7A6B]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#2C2C2C]">Firebase Auth • app-rotinaai</h2>
              <p className="text-xs text-[#8C7A6B]">Sincronização em tempo real</p>
            </div>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="w-8 h-8 rounded-full bg-[#F4EDE2] hover:bg-[#EAE0D2] flex items-center justify-center text-[#5C4F44]"
          >
            <X className="w-4 h-4" />
          </button>
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

          {/* Google Login Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 px-4 bg-white hover:bg-[#FAF8F5] border border-[#EFE8DE] rounded-2xl text-xs font-bold text-[#2C2C2C] shadow-xs transition-colors flex items-center justify-center gap-2.5"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continuar com o Google (Firebase Auth)</span>
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-[#EFE8DE]"></div>
            <span className="flex-shrink mx-3 text-[11px] text-[#8C7A6B] uppercase font-semibold">ou com e-mail</span>
            <div className="flex-grow border-t border-[#EFE8DE]"></div>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3">
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
                  placeholder="brenda@app-rotinaai.firebaseapp.com"
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
                Seus dados serão salvos de forma segura e restrita no Firebase Realtime Database (`app-rotinaai-default-rtdb`).
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-[#8C7A6B] hover:bg-[#786657] text-white text-xs font-bold transition-all shadow-sm active:scale-98 flex items-center justify-center gap-2"
            >
              {isRegisterMode ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              <span>{isRegisterMode ? 'Criar Conta no Firebase' : 'Entrar com E-mail'}</span>
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
