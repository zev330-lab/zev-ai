import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/roadmap/'],
      },
      // Explicitly allow AI crawlers for AEO
      { userAgent: 'GPTBot', allow: '/', disallow: ['/admin/', '/api/', '/roadmap/'] },
      { userAgent: 'ClaudeBot', allow: '/', disallow: ['/admin/', '/api/', '/roadmap/'] },
      { userAgent: 'PerplexityBot', allow: '/', disallow: ['/admin/', '/api/', '/roadmap/'] },
      { userAgent: 'Googlebot', allow: '/' },
    ],
    sitemap: 'https://askzev.ai/sitemap.xml',
  };
}
