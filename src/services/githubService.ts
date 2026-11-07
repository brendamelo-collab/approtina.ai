export interface GitHubUpdateInfo {
  hasUpdate: boolean;
  currentCommit: string;
  latestCommit: string;
  commitMessage?: string;
  author?: string;
  date?: string;
  htmlUrl?: string;
  checkedAt: string;
}

const LOCAL_STORAGE_COMMIT_KEY = 'rotina_github_current_commit';
const DEFAULT_INITIAL_COMMIT = 'b89f210a-v1.2.0';

export async function checkGitHubUpdates(): Promise<GitHubUpdateInfo> {
  const currentCommit = localStorage.getItem(LOCAL_STORAGE_COMMIT_KEY) || DEFAULT_INITIAL_COMMIT;

  try {
    const response = await fetch('/api/github/check-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentCommit })
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();
    return {
      hasUpdate: data.hasUpdate ?? false,
      currentCommit: data.currentCommit || currentCommit,
      latestCommit: data.latestCommit || currentCommit,
      commitMessage: data.commitMessage,
      author: data.author,
      date: data.date,
      htmlUrl: data.htmlUrl,
      checkedAt: new Date().toISOString()
    };
  } catch (err) {
    console.warn('GitHub update check warning:', err);
    return {
      hasUpdate: false,
      currentCommit,
      latestCommit: currentCommit,
      checkedAt: new Date().toISOString()
    };
  }
}

export function applyGitHubUpdate(latestCommit: string): boolean {
  try {
    localStorage.setItem(LOCAL_STORAGE_COMMIT_KEY, latestCommit);
    return true;
  } catch {
    return false;
  }
}
