'use client';

import { Link } from '@/i18n/routing';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function AdminNavbar() {
    const tNav = useTranslations('admin.nav');
    const pathname = usePathname();

    const isActive = (path: string) => {
        return pathname === path || pathname.startsWith(`${path}/`);
    };

    const navItems = [
        { href: '/admin', label: tNav('celebrities'), exact: true },
        { href: '/admin/categories', label: tNav('categories') },
        { href: '/admin/analytics', label: '📊 ' + 'Analytics' }, // Analytics might not be in nav translation yet
        { href: '/admin/reports', label: tNav('feedbacks') },
    ];

    return (
        <nav className="bg-white shadow-sm border-b border-gray-200 mb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center mr-8">
                            <span className="text-xl font-bold text-gray-800">Admin Panel</span>
                        </div>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
                            {navItems.map((item) => {
                                const active = item.exact
                                    ? pathname === item.href || pathname.endsWith(item.href) // Handle locale prefix
                                    : pathname.includes(item.href);

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href as any}
                                        className={`inline-flex items-center px-4 py-2 border-b-2 text-sm font-medium transition-colors ${active
                                            ? 'border-blue-500 text-gray-900'
                                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                            }`}
                                    >
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                    <div className="flex items-center">
                        <Link
                            href="/"
                            className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-2"
                        >
                            <span>←</span>
                            {tNav('home')}
                        </Link>
                    </div>
                </div>
            </div>
            {/* Mobile Menu could be added here if needed */}
        </nav>
    );
}