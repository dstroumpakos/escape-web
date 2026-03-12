import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/company/login', '/company/register', '/company/onboarding'],
      },
    ],
    sitemap: 'https://unlocked.gr/sitemap.xml',
  };
}
