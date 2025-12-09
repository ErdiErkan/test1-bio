'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useEffect, useTransition } from 'react';
import { searchCategories, CategorySearchResult } from '@/actions/search';

export default function AnalyticsToolbar() {
    const t = useTranslations('analytics');
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const locale = pathname.split('/')[1] || 'en';

    const [period, setPeriod] = useState(searchParams.get('period') || 'weekly');
    const [dimension, setDimension] = useState(searchParams.get('dimension') || 'global');
    const [value, setValue] = useState(searchParams.get('value') || '');

    // Combobox State
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<CategorySearchResult[]>([]);
    const [isSearching, startTransition] = useTransition();
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Sync with URL on mount/update
    useEffect(() => {
        setPeriod(searchParams.get('period') || 'weekly');
        setDimension(searchParams.get('dimension') || 'global');
        setValue(searchParams.get('value') || '');
    }, [searchParams]);

    // Search Effect
    useEffect(() => {
        if (dimension === 'category' && query.length >= 2) {
            const timer = setTimeout(() => {
                startTransition(async () => {
                    const results = await searchCategories(query, locale);
                    setSuggestions(results);
                    setShowSuggestions(true);
                });
            }, 300);
            return () => clearTimeout(timer);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }, [query, dimension, locale]);

    const handleFilter = (newValue?: string) => {
        const val = newValue !== undefined ? newValue : value;

        const params = new URLSearchParams(searchParams);
        params.set('period', period);
        params.set('dimension', dimension);
        if (val) {
            params.set('value', val);
        } else {
            params.delete('value');
        }

        router.push(`${pathname}?${params.toString()}`);
    };

    // Auto-submit on Dropdown Change
    useEffect(() => {
        // Only trigger if we are not changing dimension to 'category' which requires input
        // If dimension changed to global, we trigger.
        // If dimension changed to zodiac, we wait for zodiac selection (or it's handled in its own select)

        if (dimension === 'global') {
             handleFilter('');
        }
        // For others, we wait for input/selection
    }, [period, dimension]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleCategorySelect = (slug: string) => {
        setValue(slug);
        setQuery(''); // Or keep the name? Usually clearing query or setting it to name is fine.
        setShowSuggestions(false);
        handleFilter(slug);
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-wrap gap-4 items-center z-20 relative">
            {/* Period Selector */}
            <div className="flex flex-col">
                <label className="text-xs font-semibold text-gray-500 mb-1">{t('period')}</label>
                <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="daily">{t('periods.daily')}</option>
                    <option value="weekly">{t('periods.weekly')}</option>
                    <option value="monthly">{t('periods.monthly')}</option>
                    <option value="yearly">{t('periods.yearly')}</option>
                    <option value="all_time">{t('periods.all_time')}</option>
                </select>
            </div>

            {/* Dimension Selector */}
            <div className="flex flex-col">
                <label className="text-xs font-semibold text-gray-500 mb-1">{t('dimension')}</label>
                <select
                    value={dimension}
                    onChange={(e) => {
                        setDimension(e.target.value);
                        setValue(''); // Reset value on dimension change
                        setQuery('');
                    }}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="global">{t('dimensions.global')}</option>
                    <option value="category">{t('dimensions.category')}</option>
                    <option value="zodiac">{t('dimensions.zodiac')}</option>
                    <option value="born">{t('dimensions.born')}</option>
                </select>
            </div>

            {/* Conditional Value Input */}
            {dimension !== 'global' && (
                <div className="flex flex-col relative">
                    <label className="text-xs font-semibold text-gray-500 mb-1">
                        {dimension === 'category' ? 'Category Name' :
                            dimension === 'zodiac' ? 'Zodiac Sign' :
                                'Birth Year'}
                    </label>

                    {dimension === 'zodiac' ? (
                        <select
                            value={value}
                            onChange={(e) => {
                                setValue(e.target.value);
                                const params = new URLSearchParams(searchParams);
                                params.set('period', period);
                                params.set('dimension', dimension);
                                params.set('value', e.target.value);
                                router.push(`${pathname}?${params.toString()}`);
                            }}
                            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-40"
                        >
                            <option value="">Select...</option>
                            {['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'].map(z => (
                                <option key={z} value={z}>{z.charAt(0).toUpperCase() + z.slice(1)}</option>
                            ))}
                        </select>
                    ) : dimension === 'category' ? (
                         <div className="relative w-64">
                            <input
                                type="text"
                                value={query || (value ? value : '')} // Show value if query empty?
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    if(e.target.value === '') {
                                        setValue('');
                                        // Optional: Clear filter immediately?
                                    }
                                }}
                                onFocus={() => query.length >= 2 && setShowSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                placeholder="Search category..."
                                className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full"
                            />
                            {isSearching && <div className="absolute right-2 top-2 text-xs text-gray-400">...</div>}

                            {showSuggestions && suggestions.length > 0 && (
                                <ul className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto z-50">
                                    {suggestions.map((cat) => (
                                        <li
                                            key={cat.slug}
                                            onClick={() => handleCategorySelect(cat.slug)}
                                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                        >
                                            {cat.name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                         </div>
                    ) : (
                        <div className="flex gap-2">
                            <input
                                type="number"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                onBlur={() => handleFilter()}
                                onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                                placeholder="YYYY"
                                className="border border-gray-300 rounded-md px-3 py-2 text-sm w-24"
                            />
                            <button
                                onClick={() => handleFilter()}
                                className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700"
                            >
                                Go
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
