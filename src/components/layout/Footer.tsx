import { useTranslations } from 'next-intl'

export default function Footer() {
  const t = useTranslations('common')
  return (
    <footer className="bg-white border-t border-gray-200 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <p className="text-center text-gray-600 text-sm">
          {t('copyright', { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  )
}
