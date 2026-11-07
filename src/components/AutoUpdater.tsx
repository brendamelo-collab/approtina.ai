import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw, Rocket } from 'lucide-react';

// Build id embedded by vite.config.ts (GitHub commit SHA in the GitHub Actions build)
declare const __APP_BUILD_ID__: string;

const GITHUB_REPO = 'brendamelo-collab/approtina.ai';
const WORKFLOW_FILE = 'firebase-hosting.yml';
const VERSION_POLL_MS = 30 * 1000; // checks if a new version is live
const GITHUB_POLL_MS = 90 * 1000; // checks if a new version is being published (GitHub allows ~60 req/h without login)
const RELOAD_COUNTDOWN_S = 5;
const MAX_TYPING_WAIT_MS = 2 * 60 * 1000;

type Phase = 'idle' | 'deploying' | 'reloading';

const currentBuildId = (() => {
  try {
    return __APP_BUILD_ID__;
  } catch {
    return '';
  }
})();

const isTyping = () => {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
};

// Gets the new service worker in place, then reloads the page
const reloadIntoNewVersion = async (targetBuildId: string) => {
  const attemptKey = `rotina_ai_update_attempt_${targetBuildId}`;
  let attempts = 0;
  try {
    attempts = Number(sessionStorage.getItem(attemptKey) || '0');
    sessionStorage.setItem(attemptKey, String(attempts + 1));
  } catch {
    // ignore
  }
  if (attempts >= 3) return; // avoid reload loops

  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      if (attempts >= 1) {
        // Second try: drop the cached app completely
        await Promise.all(regs.map((r) => r.unregister()));
      } else {
        await Promise.all(regs.map((r) => r.update().catch(() => undefined)));
        await new Promise<void>((resolve) => {
          const done = () => resolve();
          navigator.serviceWorker.addEventListener('controllerchange', done, { once: true });
          setTimeout(done, 6000);
        });
      }
    }
  } catch {
    // ignore and reload anyway
  }
  window.location.reload();
};

export const AutoUpdater: React.FC = () => {
  const [phase, setPhase] = useState<Phase>('idle');
  const [countdown, setCountdown] = useState(RELOAD_COUNTDOWN_S);
  const targetBuildRef = useRef<string | null>(null);
  const githubBlockedUntil = useRef(0);

  useEffect(() => {
    if (!currentBuildId) return; // local development: nothing to compare

    let stopped = false;

    const checkLiveVersion = async () => {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!stopped && data?.buildId && data.buildId !== currentBuildId) {
          targetBuildRef.current = data.buildId;
          setPhase('reloading');
        }
      } catch {
        // offline: try again later
      }
    };

    const checkGitHubDeploy = async () => {
      if (Date.now() < githubBlockedUntil.current || document.visibilityState !== 'visible') return;
      try {
        const res = await fetch(
          `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${WORKFLOW_FILE}/runs?per_page=1&branch=main`,
          { cache: 'no-store', headers: { Accept: 'application/vnd.github+json' } }
        );
        if (res.status === 403 || res.status === 429) {
          githubBlockedUntil.current = Date.now() + 10 * 60 * 1000; // rate limited: pause 10 min
          return;
        }
        if (!res.ok) return;
        const data = await res.json();
        const run = data?.workflow_runs?.[0];
        if (!run || stopped) return;
        const runBuildId = String(run.head_sha || '').slice(0, 12);
        const inProgress = run.status !== 'completed';
        setPhase((prev) => {
          if (prev === 'reloading') return prev;
          if (inProgress && runBuildId && runBuildId !== currentBuildId) return 'deploying';
          return prev === 'deploying' && !inProgress ? 'idle' : prev;
        });
        // Deploy just finished: check right away instead of waiting for the next poll
        if (!inProgress && runBuildId !== currentBuildId) checkLiveVersion();
      } catch {
        // ignore network errors
      }
    };

    checkLiveVersion();
    checkGitHubDeploy();
    const versionTimer = setInterval(checkLiveVersion, VERSION_POLL_MS);
    const githubTimer = setInterval(checkGitHubDeploy, GITHUB_POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        checkLiveVersion();
        checkGitHubDeploy();
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      stopped = true;
      clearInterval(versionTimer);
      clearInterval(githubTimer);
      document.removeEventListener('visibilitychange', onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // While deploying, also check the live version more often so the reload happens as soon as it is out
  useEffect(() => {
    if (phase !== 'deploying') return;
    const fast = setInterval(async () => {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (data?.buildId && data.buildId !== currentBuildId) {
          targetBuildRef.current = data.buildId;
          setPhase('reloading');
        }
      } catch {
        // ignore
      }
    }, 10 * 1000);
    return () => clearInterval(fast);
  }, [phase]);

  // Countdown, then reload (waits while the user is typing, up to 2 minutes)
  useEffect(() => {
    if (phase !== 'reloading') return;
    setCountdown(RELOAD_COUNTDOWN_S);
    const startedAt = Date.now();
    let left = RELOAD_COUNTDOWN_S;
    const timer = setInterval(() => {
      left -= 1;
      if (left > 0) {
        setCountdown(left);
        return;
      }
      if (isTyping() && Date.now() - startedAt < MAX_TYPING_WAIT_MS) {
        setCountdown(0);
        return;
      }
      clearInterval(timer);
      reloadIntoNewVersion(targetBuildRef.current || 'latest');
    }, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  if (phase === 'idle') return null;

  const deploying = phase === 'deploying';

  return (
    <div className="fixed top-3 left-0 right-0 z-[100] px-3 pointer-events-none">
      <div className="max-w-md mx-auto bg-[#FAF8F5] border-2 border-[#B78A58]/40 rounded-2xl p-3 shadow-lg flex items-center gap-3 text-xs animate-in fade-in slide-in-from-top-3 duration-300 pointer-events-auto">
        <div className="w-9 h-9 rounded-xl bg-[#F7EEE3] text-[#B78A58] flex items-center justify-center shrink-0">
          {deploying ? <Rocket className="w-5 h-5 animate-bounce" /> : <RefreshCw className="w-5 h-5 animate-spin" />}
        </div>
        <div className="min-w-0">
          <p className="font-extrabold text-[#2C2C2C]">
            {deploying ? 'Nova atualização sendo publicada' : 'Atualização pronta!'}
          </p>
          <p className="text-[11px] text-[#8C7A6B] mt-0.5">
            {deploying
              ? 'A página vai recarregar sozinha em até 2 minutos.'
              : countdown > 0
                ? `Recarregando em ${countdown}s...`
                : 'Recarregando assim que você terminar de digitar...'}
          </p>
        </div>
      </div>
    </div>
  );
};
