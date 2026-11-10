import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share, PlusSquare, X, Check, Smartphone } from 'lucide-react';
import { isNativeAlarmAvailable } from '../services/nativeAlarm';

// Android: the real app (with alarm, voice and full screen) is the APK built by GitHub
export const ANDROID_APK_URL =
  'https://github.com/brendamelo-collab/approtina.ai/releases/download/android-latest/rotina-ai.apk';
const isAndroidBrowser = () => typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);

interface PWAInstallButtonProps {
  variant?: 'button' | 'banner' | 'card';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'button',
  className = ''
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [installedToast, setInstalledToast] = useState(false);
  const [showAndroidModal, setShowAndroidModal] = useState(false);

  // Already inside the Android app: nothing to install
  if (isNativeAlarmAvailable()) return null;

  const android = isAndroidBrowser();

  if (isInstalled && !android) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEF5EF] border border-[#B7D2B9] text-[#2C5230] text-xs font-bold">
        <Check className="w-3.5 h-3.5 text-[#2C5230]" />
        <span>App Instalado</span>
      </div>
    );
  }

  const handleInstallClick = async () => {
    if (android) {
      // Downloads the APK and shows how to install it
      window.location.href = ANDROID_APK_URL;
      setShowAndroidModal(true);
      return;
    }
    if (isInstallable) {
      const ok = await install();
      if (ok) {
        setInstalledToast(true);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // General prompt or guided instructions
      setShowIOSModal(true);
    }
  };

  return (
    <>
      {variant === 'banner' ? (
        <div className={`bg-[#F7F4EE] border border-[#EAE3D6] rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-xs ${className}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#8C7A6B] text-white flex items-center justify-center shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#2C2C2C]">
                {android ? 'Baixar o app Android do Rotina.ai' : 'Instalar o Rotina.ai no seu Aparelho'}
              </h4>
              <p className="text-[11px] text-[#8C7A6B]">
                {android
                  ? 'Com alarme no horário, voz e tela cheia, mesmo com o app fechado'
                  : 'Acesse como aplicativo na sua tela inicial sem precisar digitar o site'}
              </p>
            </div>
          </div>
          <button
            onClick={handleInstallClick}
            className="px-3.5 py-2 bg-[#8C7A6B] hover:bg-[#786657] text-white text-xs font-bold rounded-xl transition-colors shrink-0 shadow-2xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{android ? 'Baixar' : 'Instalar'}</span>
          </button>
        </div>
      ) : (
        <button
          onClick={handleInstallClick}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#8C7A6B] hover:bg-[#786657] text-white text-xs font-bold whitespace-nowrap shrink-0 transition-all shadow-2xs active:scale-95 ${className}`}
          title={android ? 'Baixar o app Android do Rotina.ai' : 'Instalar Rotina.ai como Aplicativo no Celular ou Computador'}
        >
          <Download className="w-3.5 h-3.5" />
          <span className="sm:hidden">{android ? 'Baixar app' : 'Instalar app'}</span>
          <span className="hidden sm:inline">{android ? 'Baixar app Android' : 'Baixar / Instalar App'}</span>
        </button>
      )}

      {/* Android: how to install the downloaded APK */}
      {showAndroidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-[#FDFBF7] rounded-3xl p-5 shadow-2xl border border-[#EFE8DE] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DE]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#F7EEE3] flex items-center justify-center text-[#8C7A6B]">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#2C2C2C]">Instalar o app Android</h3>
                  <p className="text-[11px] text-[#8C7A6B]">O download do rotina-ai.apk começou</p>
                </div>
              </div>
              <button
                onClick={() => setShowAndroidModal(false)}
                className="w-8 h-8 rounded-full bg-[#F4EDE2] flex items-center justify-center text-[#5C4F44]"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ol className="space-y-2 text-xs text-[#2C2C2C] list-decimal pl-4">
              <li>Quando o download terminar, toque em <strong>Abrir</strong> (ou abra pela pasta Downloads).</li>
              <li>Se o Android pedir, permita <strong>instalar apps desta fonte</strong> e toque em Instalar.</li>
              <li>Abra o Rotina.ai, entre na sua conta e ative as permissões do <strong>alarme</strong> na tela inicial.</li>
            </ol>
            <a
              href={ANDROID_APK_URL}
              className="block text-center w-full py-2.5 bg-[#8C7A6B] hover:bg-[#786657] text-white text-xs font-bold rounded-xl"
            >
              Baixar de novo
            </a>
          </div>
        </div>
      )}

      {/* Modal Guia para iOS Safari ou Navegadores sem suporte a prompt automático */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-[#FDFBF7] rounded-3xl p-5 shadow-2xl border border-[#EFE8DE] space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DE]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#F7EEE3] flex items-center justify-center text-[#8C7A6B]">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#2C2C2C]">Como Instalar o Rotina.ai</h3>
                  <p className="text-[11px] text-[#8C7A6B]">Adicione à sua tela inicial em segundos</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="w-8 h-8 rounded-full bg-[#F4EDE2] flex items-center justify-center text-[#5C4F44]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="space-y-3 text-xs text-[#2C2C2C]">
                <div className="p-3 bg-white border border-[#EFE8DE] rounded-2xl space-y-2">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#8C7A6B] text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <p className="text-xs">
                      Toque no ícone de <strong>Compartilhar</strong> <Share className="w-3.5 h-3.5 inline text-[#8C7A6B]" /> na barra do navegador Safari.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#8C7A6B] text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <p className="text-xs">
                      Role o menu para baixo e selecione <strong>Adicionar à Tela de Início</strong> <PlusSquare className="w-3.5 h-3.5 inline text-[#8C7A6B]" />.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-[#2C2C2C]">
                <p className="text-xs text-[#5C4F44]">
                  No seu navegador (Chrome, Edge ou Brave), clique no menu de opções do navegador (três pontos <strong className="text-base">⋮</strong> ou ícone de instalação no topo da barra de endereços) e escolha <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
                </p>
              </div>
            )}

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 bg-[#8C7A6B] hover:bg-[#786657] text-white text-xs font-bold rounded-xl transition-colors shadow-2xs"
            >
              Entendido!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
