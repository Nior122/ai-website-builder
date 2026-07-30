// =============================================================================
// Marketing Blog Content Helper
// =============================================================================
// Reads local markdown files under content/blog/, parses frontmatter with
// gray-matter, and renders the body to HTML with marked. Used by the public
// (marketing) blog pages. This is the studio's own marketing blog — it is
// distinct from the per-project user blog feature in features/blog/.
//
// Content here is author-controlled local files committed to the repo, so
// rendered HTML is safe to inject via dangerouslySetInnerHTML.
// =============================================================================

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';

export interface BlogPostMeta {
  slug: string;
  title: string;
  date: string; // ISO date string from frontmatter (YYYY-MM-DD)
  excerpt: string;
  author: string;
  tags?: string[];
}

export interface BlogPost extends BlogPostMeta {
  contentHtml: string;
}

const BLOG_DIR = join(process.cwd(), 'content', 'blog');

// Configure marked once for consistent output.
marked.setOptions({
  gfm: true,
  breaks: false,
});

function parseFrontmatter(raw: string): {
  meta: BlogPostMeta;
  body: string;
} {
  const { data, content } = matter(raw);

  if (typeof data.title !== 'string' || (typeof data.date !== 'string' && !(data.date instanceof Date))) {
    throw new Error(
      `Blog post missing required frontmatter (title, date). Got: ${JSON.stringify(data)}`
    );
  }

  // gray-matter parses YAML bare dates (e.g. `date: 2026-07-09`) into JS Date
  // objects; a quoted scalar stays a string. Normalize both to a YYYY-MM-DD
  // ISO string so downstream sorting and formatting are consistent.
  const dateStr =
    data.date instanceof Date
      ? data.date.toISOString().slice(0, 10)
      : data.date;

  const meta: BlogPostMeta = {
    slug: '', // filled in by caller
    title: data.title,
    date: dateStr,
    excerpt: typeof data.excerpt === 'string' ? data.excerpt : '',
    author: typeof data.author === 'string' ? data.author : 'AI Website Builder Studio',
    tags: Array.isArray(data.tags) ? data.tags.map(String) : undefined,
  };

  return { meta, body: content };
}

/**
 * List every blog post meta, newest first. Safe to call from a server
 * component at build time. Returns [] if the content dir does not exist.
 */
export function getAllPosts(includeUnpublished = false): BlogPostMeta[] {
  if (!existsSync(BLOG_DIR)) return [];

  const files = readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md'));
  const posts: BlogPostMeta[] = files.map((file) => {
    const raw = readFileSync(join(BLOG_DIR, file), 'utf8');
    const { meta } = parseFrontmatter(raw);
    meta.slug = file.replace(/\.md$/, '');
    return meta;
  });

  posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  // `includeUnpublished` reserved for future draft gating; all bundled files
  // are published. Suppress unused-var lint by referencing it.
  void includeUnpublished;
  return posts;
}

/**
 * Load a single post (meta + rendered HTML body). Returns null if no file
 * matches the slug.
 */
export function getPost(slug: string): BlogPost | null {
  const filePath = join(BLOG_DIR, `${slug}.md`);
  if (!existsSync(filePath)) return null;

  const raw = readFileSync(filePath, 'utf8');
  const { meta, body } = parseFrontmatter(raw);
  meta.slug = slug;

  // { async: false } forces the synchronous overload → returns string.
  const contentHtml = marked.parse(body, { async: false }) as string;

  return { ...meta, contentHtml };
}

/**
 * Slugs available for generateStaticParams. Empty array when content missing.
 */
export function getAllSlugs(): string[] {
  return getAllPosts().map((p) => p.slug);
}
