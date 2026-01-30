// GitHub Search API - free, 10 requests/min unauthenticated, 30/min with token

interface GitHubRepo {
  id: number;
  full_name: string;
  html_url: string;
  description: string | null;
  homepage: string | null;
  stargazers_count: number;
  created_at: string;
  updated_at: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  topics: string[];
}

interface GitHubSearchResult {
  items: GitHubRepo[];
}

export interface GitHubMention {
  id: string;
  url: string;
  title: string;
  description: string | null;
  author: string;
  publishedDate: string;
  stars: number;
  homepage: string | null;
  topics: string[];
}

async function searchGitHub(query: string): Promise<GitHubMention[]> {
  try {
    const params = new URLSearchParams({
      q: query,
      sort: "updated",
      order: "desc",
      per_page: "30",
    });

    const res = await fetch(`https://api.github.com/search/repositories?${params}`, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "VercelSocialTracker",
      },
    });

    if (!res.ok) {
      console.error("GitHub API error:", res.status);
      return [];
    }

    const data: GitHubSearchResult = await res.json();

    return data.items.map((repo) => ({
      id: String(repo.id),
      url: repo.html_url,
      title: repo.full_name,
      description: repo.description,
      author: repo.owner.login,
      publishedDate: repo.updated_at,
      stars: repo.stargazers_count,
      homepage: repo.homepage,
      topics: repo.topics || [],
    }));
  } catch (error) {
    console.error("GitHub search error:", error);
    return [];
  }
}

export async function searchGitHubProjects() {
  // Search for repos that are deployed on Vercel or built with v0
  const [vercelDeployed, v0Projects, vercelAppLinks] = await Promise.all([
    searchGitHub("vercel deployed in:readme stars:>5"),
    searchGitHub("v0.dev OR v0 vercel in:readme stars:>3"),
    searchGitHub("vercel.app in:readme stars:>10"),
  ]);

  const all = [...vercelDeployed, ...v0Projects, ...vercelAppLinks];

  // Dedupe
  const seen = new Set<string>();
  return all.filter((repo) => {
    if (seen.has(repo.id)) return false;
    seen.add(repo.id);
    return true;
  });
}
