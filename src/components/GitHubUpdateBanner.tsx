import React, { useEffect, useState } from 'react';
import { checkGitHubUpdates, applyGitHubUpdate, GitHubUpdateInfo } from '../services/githubService';
import { RefreshCw, Sparkles, Check, X, GitPullRequest } from 'lucide-react';

export const GitHubUpdateBanner: React.FC = () => {
  const [updateInfo, setUpdateInfo] = useState<GitHubUpdateInfo | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check for GitHub updates on app startup
    checkGitHubUpdates().then((info) => {
      if (info.hasUpdate) {
        setUpdateInfo(info);
      }
    });

    // Periodically check for new commits every 3 minutes
    const interval = setInterval(() => {
      checkGitHubUpdates().then((info) => {
        if (info.hasUpdate) {
          setUpdateInfo(info);
        }
      });
    }, 3 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  if (!updateInfo || !updateInfo.hasUpdate || dismissed) {
    return null;
  }

  const handleApplyUpdate = async () => {
    setIsUpdating(true);
    setTimeout(() => {
      applyGitHubUpdate(updateInfo.latestCommit);
      setIsUpdating(false);
      setDismissed(true);
      window.location.reload();
    }, 1500);
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 sm:px-6 pt-2 select-none animate-in fade-in slide-in-from-top-3 duration-300">
      <div className="bg-[#FAF8F5] border-2 border-[#B78A58]/40 rounded-2xl p-3.5 shadow-md flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#F7EEE3] text-[#B78A58] flex items-center justify-center shrink-0">
            <GitPullRequest className="w-5 h-5 animate-bounce" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-extrabold text-[#2C2C2C] flex items-center gap-1">
                🚀 Nova Atualização no GitHub!
              </span>
              <span className="text-[9px] font-bold text-[#2C5230] bg-[#EEF5EF] px-1.5 py-0.5 rounded-md border border-[#B7D2B9]">
                {updateInfo.latestCommit}
              </span>
            </div>
            <p className="text-[11px] text-[#8C7A6B] truncate mt-0.5">
              {updateInfo.commitMessage || 'Novas melhorias e ajustes prontos para instalar.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleApplyUpdate}
            disabled={isUpdating}
            className="bg-[#8C7A6B] hover:bg-[#786657] text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
            <span>{isUpdating ? 'Atualizando...' : 'Atualizar'}</span>
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 text-[#8C7A6B] hover:text-[#2C2C2C] rounded-lg hover:bg-[#F4EDE2]"
            title="Lembrar mais tarde"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
