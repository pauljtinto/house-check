import type { MetadataRoute } from 'next';

/** Second layer behind the X-Robots-Tag header in next.config.ts. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', disallow: '/' },
  };
}
