import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
    // A list of all locales that are supported
    locales: ['en', 'tr', 'es', 'it', 'pt', 'fr', 'de'],

    // Used when no locale matches
    defaultLocale: 'en',

    // Explicitly configure prefix strategy
    localePrefix: 'as-needed',

    pathnames: {
        '/': '/',
        '/login': { en: '/login', tr: '/giris' },
        '/admin': { en: '/admin', tr: '/yonetim' },
        // ✅ EKLENEN ADMIN ROTALARI
        '/admin/categories': { en: '/admin/categories', tr: '/yonetim/kategoriler' },
        '/admin/analytics': { en: '/admin/analytics', tr: '/yonetim/analitik' },
        '/admin/settings': { en: '/admin/settings', tr: '/yonetim/ayarlar' },
        '/admin/reports': { en: '/admin/reports', tr: '/yonetim/bildirimler' },
        '/admin/add': { en: '/admin/add', tr: '/yonetim/ekle' },
        '/admin/edit/[id]': { en: '/admin/edit/[id]', tr: '/yonetim/duzenle/[id]' },
        '/admin/competitions': { en: '/admin/competitions', tr: '/yonetim/yarismalar' },

        '/trending': {
            en: '/trending',
            tr: '/trendler',
            de: '/trends',
            es: '/tendencias',
            fr: '/tendances',
            it: '/tendenze',
            pt: '/tendencias'
        },

        '/celebrity/[slug]': {
            en: '/celebrity/[slug]',
            tr: '/unlu/[slug]',
            de: '/prominente/[slug]',
            es: '/famoso/[slug]',
            fr: '/celebrite/[slug]',
            it: '/celebrita/[slug]',
            pt: '/celebridade/[slug]'
        },

        '/competitions': {
            en: '/competitions',
            tr: '/yarismalar',
            de: '/wettbewerbe',
            es: '/competiciones',
            fr: '/competitions',
            it: '/competizioni',
            pt: '/competicoes'
        },

        '/competition/[slug]': {
            en: '/competition/[slug]',
            tr: '/yarisma/[slug]',
            de: '/wettbewerb/[slug]',
            es: '/competicion/[slug]',
            fr: '/competition/[slug]',
            it: '/competizione/[slug]',
            pt: '/competicao/[slug]'
        }
    }
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter } =
    createNavigation(routing);
