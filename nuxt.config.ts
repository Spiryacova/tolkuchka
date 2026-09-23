// https://nuxt.com/docs/api/configuration/nuxt-config
import { categories, products } from './shared/mocks/products';

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  watchers: {
    chokidar: {
      usePolling: true,
      interval: 1000,
    },
  },
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@pinia/nuxt',
    '@sidebase/nuxt-auth',
    '@nuxtjs/sitemap',
    '@nuxtjs/robots',
    '@scalar/nuxt',
  ],
  site: {
    url: process.env.NUXT_SITE_URL,
  },
  sitemap: {
    exclude: ['/auth/**', '/seller/**', '/account/**', '/palettes'],
    urls: [
      ...categories.map((c) => ({
        loc: `/categories/${c.slug}`,
        changefreq: 'daily' as const,
        priority: 0.8 as const,
      })),
      ...products.map((p) => ({
        loc: `/products/${p.slug}`,
        changefreq: 'hourly' as const,
        priority: 0.7 as const,
      })),
    ],
  },
  robots: {
    disallow: ['/api', '/api-docs', '/auth', '/account', '/seller', '/cart', '/palettes'],
  },
  auth: {
    isEnabled: true,
    baseURL: '/api/auth',
    provider: { type: 'authjs', trustHost: true },
  },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    authSecret: '',
  },
  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],
  fonts: {
    providers: {
      fontshare: false,
    },
  },
  icon: {
    provider: 'server',
    serverBundle: {
      collections: ['heroicons'],
    },
  },
  nitro: {
    experimental: {
      openAPI: true,
    },
  },  
  routeRules: {
    '/api-docs': { ssr: false },
    '/api-docs/**': { ssr: false },
    // страницы каталога пересобираются не чаще раза в час
    '/products/**': { isr: 3600 },
    '/categories/**': { isr: 3600 },
  },
  scalar: {
    pathRouting: {
      basePath: '/api-docs',
    },
    metaData: {
      title: 'Толкучка API',
    },
    darkMode: true,
    showSidebar: true,
  },
});
