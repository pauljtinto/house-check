import type { NextConfig } from 'next';

/**
 * Vercel adds `X-Robots-Tag: noindex` to preview deployments automatically, but
 * NOT to the current production deployment — production is indexable by default.
 * This app serves MLS sold data at /data/comps-university-c01.csv, which should
 * not be in a search index.
 *
 * The header is what actually keeps a URL out of the index. robots.txt only asks
 * crawlers not to fetch, and a Disallow can even prevent a crawler from seeing a
 * noindex tag on the page. Both layers are set: header in headers() below,
 * robots.txt in app/robots.ts.
 *
 * NOTE: this stops the app being FOUND. It does not restrict ACCESS — anyone
 * with the URL can still read everything. See README for the access options.
 */
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },
};

export default nextConfig;
