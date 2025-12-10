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
    // Assuming locale is the first path segment (e.g. /en/admin/...)
    const locale = pathname.split('/')[1] || 'en';

    // Local state for inputs to allow typing before navigating
    const [period, setPeriod] = useState(searchParams.get('period') || 'weekly');
    const [dimension, setDimension] = useState(searchParams.get('dimension') || 'global');
    const [value, setValue] = useState(searchParams.get('value') || '');

    // Combobox State for Category Search
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<CategorySearchResult[]>([]);
    const [isSearching, startTransition] = useTransition();
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Sync local state with URL when URL changes (e.g. Back button)
    useEffect(() => {
        setPeriod(searchParams.get('period') || 'weekly');
        setDimension(searchParams.get('dimension') || 'global');
        setValue(searchParams.get('value') || '');
    }, [searchParams]);

    // Handle Category Search Debounce
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
            // Don't hide immediately if user is interacting
        }
    }, [query, dimension, locale]);

    // Push changes to URL
    const updateUrl = (newPeriod: string, newDimension: string, newValue: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('period', newPeriod);
        params.set('dimension', newDimension);

        if (newDimension !== 'global' && newValue) {
            params.set('value', newValue);
        } else {
            params.delete('value');
        }

        router.push(`${pathname}?${params.toString()}`);
    };

    const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newPeriod = e.target.value;
        setPeriod(newPeriod);
        updateUrl(newPeriod, dimension, value);
    };

    const handleDimensionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newDimension = e.target.value;
        setDimension(newDimension);
        setValue(''); // Reset value
        setQuery('');
        updateUrl(period, newDimension, '');
    };

    const handleValueCommit = () => {
        updateUrl(period, dimension, value);
    };

    const handleCategorySelect = (category: CategorySearchResult) => {
        setValue(category.slug);
        setQuery(category.name); // Show name in input
        setShowSuggestions(false);
        updateUrl(period, dimension, category.slug);
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-wrap gap-4 items-center z-20 relative">
            {/* Period Selector */}
            <div className="flex flex-col">
                <label className="text-xs font-semibold text-gray-500 mb-1">{t('period')}</label>
                <select
                    value={period}
                    onChange={handlePeriodChange}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
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
                    onChange={handleDimensionChange}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
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
                                updateUrl(period, dimension, e.target.value);
                            }}
                            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-40 bg-white"
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
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    if(e.target.value === '') setValue('');
                                }}
                                onFocus={() => query.length >= 2 && setShowSuggestions(true)}
                                // Delay blur to allow click on suggestion
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                placeholder="Search category..."
                                className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full focus:ring-blue-500 focus:border-blue-500"
                            />
                            {isSearching && <div className="absolute right-2 top-2 text-xs text-gray-400 animate-pulse">...</div>}

                            {showSuggestions && suggestions.length > 0 && (
                                <ul className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto z-50">
                                    {suggestions.map((cat) => (
                                        <li
                                            key={cat.slug}
                                            onClick={() => handleCategorySelect(cat)}
                                            className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700"
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
                                onBlur={handleValueCommit}
                                onKeyDown={(e) => e.key === 'Enter' && handleValueCommit()}
                                placeholder="YYYY"
                                className="border border-gray-300 rounded-md px-3 py-2 text-sm w-24 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button
                                onClick={handleValueCommit}
                                className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
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
