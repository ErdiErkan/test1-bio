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
        '/celebrity/[slug]': {
            en: '/celebrity/[slug]',
            tr: '/unlu/[slug]',
            de: '/prominente/[slug]',
            es: '/famoso/[slug]',
            fr: '/celebrite/[slug]',
            it: '/celebrita/[slug]',
            pt: '/celebridade/[slug]'
        }
    }
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter } =
    createNavigation(routing);