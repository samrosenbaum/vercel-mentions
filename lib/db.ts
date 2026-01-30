import { sql } from "@vercel/postgres";

export interface Mention {
  id: number;
  platform: string;
  external_id: string | null;
  url: string;
  title: string | null;
  content: string | null;
  author: string | null;
  published_at: Date | null;
  fetched_at: Date;
  keyword: string;
  score: number | null;
  highlights: string[] | null;
}

export async function createMentionsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS mentions (
      id SERIAL PRIMARY KEY,
      platform VARCHAR(50) NOT NULL,
      external_id VARCHAR(255),
      url TEXT NOT NULL UNIQUE,
      title TEXT,
      content TEXT,
      author VARCHAR(255),
      published_at TIMESTAMP,
      fetched_at TIMESTAMP DEFAULT NOW(),
      keyword VARCHAR(50),
      score FLOAT,
      highlights TEXT[]
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_mentions_platform ON mentions(platform)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_mentions_keyword ON mentions(keyword)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_mentions_published ON mentions(published_at DESC)`;
}

export async function insertMention(mention: Omit<Mention, "id" | "fetched_at">) {
  const result = await sql`
    INSERT INTO mentions (platform, external_id, url, title, content, author, published_at, keyword, score, highlights)
    VALUES (
      ${mention.platform},
      ${mention.external_id},
      ${mention.url},
      ${mention.title},
      ${mention.content},
      ${mention.author},
      ${mention.published_at?.toISOString() ?? null},
      ${mention.keyword},
      ${mention.score},
      ${mention.highlights ? `{${mention.highlights.map(h => `"${h.replace(/"/g, '\\"')}"`).join(",")}}` : null}
    )
    ON CONFLICT (url) DO UPDATE SET
      title = COALESCE(EXCLUDED.title, mentions.title),
      content = COALESCE(EXCLUDED.content, mentions.content),
      score = COALESCE(EXCLUDED.score, mentions.score),
      highlights = COALESCE(EXCLUDED.highlights, mentions.highlights)
    RETURNING id
  `;
  return result.rows[0]?.id;
}

export async function getMentions(options: {
  platform?: string;
  keyword?: string;
  limit?: number;
  offset?: number;
}): Promise<Mention[]> {
  const { platform, keyword, limit = 50, offset = 0 } = options;

  let query = `
    SELECT * FROM mentions
    WHERE 1=1
  `;
  const params: (string | number)[] = [];

  if (platform && platform !== "all") {
    params.push(platform);
    query += ` AND platform = $${params.length}`;
  }

  if (keyword && keyword !== "all") {
    params.push(keyword);
    query += ` AND keyword = $${params.length}`;
  }

  query += ` ORDER BY published_at DESC NULLS LAST`;
  params.push(limit);
  query += ` LIMIT $${params.length}`;
  params.push(offset);
  query += ` OFFSET $${params.length}`;

  const result = await sql.query(query, params);
  return result.rows as Mention[];
}

export async function getStats() {
  const totalResult = await sql`SELECT COUNT(*) as count FROM mentions`;
  const platformResult = await sql`
    SELECT platform, COUNT(*) as count
    FROM mentions
    GROUP BY platform
    ORDER BY count DESC
  `;
  const keywordResult = await sql`
    SELECT keyword, COUNT(*) as count
    FROM mentions
    GROUP BY keyword
    ORDER BY count DESC
  `;

  return {
    total: parseInt(totalResult.rows[0]?.count ?? "0"),
    byPlatform: platformResult.rows as { platform: string; count: string }[],
    byKeyword: keywordResult.rows as { keyword: string; count: string }[],
  };
}
