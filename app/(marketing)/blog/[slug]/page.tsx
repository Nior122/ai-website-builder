// =============================================================================
// Blog Post Page
// =============================================================================
// Renders a single markdown post. Statically generated via generateStaticParams
// from the bundled content dir, with ISR (revalidate hourly) so committed
// content picks up without a full rebuild.
// =============================================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllSlugs, getPost } from '@/lib/blog';
import { APP_NAME } from '@/lib/constants';

// ISR — hourly.
export const revalidate = 3600;

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: `Not Found — ${APP_NAME}` };

  return {
    title: `${post.title} — ${APP_NAME}`,
    description: post.excerpt || `${post.title} on the ${APP_NAME} blog.`,
  };
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default async function BlogPostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = getPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="mx-auto max-w-3xl px-6 py-20">
      {/* Back link */}
      <Link
        href="/blog"
        className="text-sm text-neutral-500 transition-colors hover:text-neutral-900"
      >
        ← All posts
      </Link>

      {/* Header */}
      <header className="mt-6 mb-10">
        <time className="text-xs text-neutral-400">{formatDate(post.date)}</time>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-neutral-900">
          {post.title}
        </h1>
        <p className="mt-3 text-sm text-neutral-500">By {post.author}</p>
        {post.tags && post.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Body — content is author-controlled local files, safe to inject. */}
      <div
        className="prose-blog"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: post.contentHtml }}
      />

      {/* Footer CTA */}
      <div className="mt-16 rounded-2xl border border-neutral-200 bg-neutral-50 p-8 text-center">
        <h2 className="mb-2 text-xl font-semibold text-neutral-900">
          Build your own site
        </h2>
        <p className="mb-6 text-sm text-neutral-600">
          Describe your business and get a complete website in seconds.
        </p>
        <Link
          href="/sign-up"
          className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-6 py-3 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Start Building Free
        </Link>
      </div>
    </article>
  );
}
