'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/routing'
import { ChangeEvent, useTransition } from 'react'
import { useParams } from 'next/navigation'

export default function LanguageSwitcher() {
    const t = useTranslations('nav')
    const locale = useLocale()
    const router = useRouter()
    const pathname = usePathname()
    const params = useParams()
    const [isPending, startTransition] = useTransition()

    const onSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const nextLocale = e.target.value
        startTransition(() => {
            router.replace(
                // @ts-expect-error -- known next-intl type issue with dynamic params
                { pathname, params },
                { locale: nextLocale }
            )
        })
    }

    return (
        <label className="relative inline-flex items-center">
            <span className="sr-only">{t('switch_language')}</span>
            <select
                defaultValue={locale}
                onChange={onSelectChange}
                disabled={isPending}
                className="appearance-none bg-transparent py-2 pl-3 pr-8 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
                <option value="en">🇺🇸 EN</option>
                <option value="tr">🇹🇷 TR</option>
                <option value="es">🇪🇸 ES</option>
                <option value="fr">🇫🇷 FR</option>
                <option value="de">🇩🇪 DE</option>
                <option value="it">🇮🇹 IT</option>
                <option value="pt">🇵🇹 PT</option>
            </select>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                ▼
            </span>
        </label>
    )
}
