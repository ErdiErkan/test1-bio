import { Link } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher'

export default function Header() {
  const t = useTranslations('nav')

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              ⭐ CelebHub
            </h1>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center space-x-4">
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md transition-colors"
            >
              {t('home')}
            </Link>
            <Link
              href="/admin"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              {t('admin')}
            </Link>
            <div className="border-l pl-4 ml-4">
              <LanguageSwitcher />
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}
