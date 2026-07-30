// =============================================================================
// Blog Listing
// =============================================================================
// Public blog index. Reads bundled markdown via lib/blog helper. Posts are
// newest first. Static — no revalidation needed for committed content.
// =============================================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllPosts } from '@/lib/blog';
import { APP_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Blog — ${APP_NAME}`,
  description: 'Product updates, design guidance, and how-to pieces from the studio.',
};

function formatDate(iso: string): string {
  // Parse the YYYY-MM-DD string as a local date to avoid TZ shifts shifting the day.
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="mx-auto max-w-4xl px-6 py-20">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-neutral-900">
          The Blog
        </h1>
        <p className="text-lg text-neutral-500">
          Product updates, design guidance, and how-to pieces.
        </p>
      </div>

      {posts.length === 0 ? (
        <p className="text-center text-neutral-500">No posts yet. Check back soon.</p>
      ) : (
        <div className="space-y-10">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="border-b border-neutral-200 pb-10 last:border-b-0"
            >
              <time className="text-xs text-neutral-400">{formatDate(post.date)}</time>
              <h2 className="mt-1 text-2xl font-semibold text-neutral-900">
                <Link
                  href={`/blog/${post.slug}`}
                  className="transition-colors hover:text-neutral-600"
                >
                  {post.title}
                </Link>
              </h2>
              <p className="mt-3 text-neutral-600">{post.excerpt}</p>
              <div className="mt-4 flex items-center gap-3">
                <Link
                  href={`/blog/${post.slug}`}
                  className="text-sm font-medium text-neutral-900 underline-offset-4 hover:underline"
                >
                  Read more →
                </Link>
                {post.tags && post.tags.length > 0 && (
                  <span className="text-xs text-neutral-400">
                    {post.tags.join(' · ')}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
