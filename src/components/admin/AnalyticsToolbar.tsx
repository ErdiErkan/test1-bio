'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';

export default function AnalyticsToolbar() {
    const t = useTranslations('analytics');
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const [period, setPeriod] = useState(searchParams.get('period') || 'weekly');
    const [dimension, setDimension] = useState(searchParams.get('dimension') || 'global');
    const [value, setValue] = useState(searchParams.get('value') || '');

    // Sync with URL on mount/update
    useEffect(() => {
        setPeriod(searchParams.get('period') || 'weekly');
        setDimension(searchParams.get('dimension') || 'global');
        setValue(searchParams.get('value') || '');
    }, [searchParams]);

    const handleFilter = () => {
        const params = new URLSearchParams(searchParams);
        params.set('period', period);
        params.set('dimension', dimension);
        if (value) {
            params.set('value', value);
        } else {
            params.delete('value');
        }

        // Reset to first page? Not strictly pagination here, but good practice if we had it.
        router.push(`${pathname}?${params.toString()}`);
    };

    // Auto-submit on Dropdown Change
    useEffect(() => {
        handleFilter();
    }, [period, dimension]); // eslint-disable-line react-hooks/exhaustive-deps

    // For Input, we might want a button or debounce, but for now simple auto-submit on blur/Enter
    const handleInputSubmit = () => {
        handleFilter();
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-wrap gap-4 items-center">
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
                <div className="flex flex-col">
                    <label className="text-xs font-semibold text-gray-500 mb-1">
                        {dimension === 'category' ? 'Category Slug' :
                            dimension === 'zodiac' ? 'Zodiac Sign' :
                                'Birth Year'}
                    </label>

                    {dimension === 'zodiac' ? (
                        <select
                            value={value}
                            onChange={(e) => {
                                setValue(e.target.value);
                                // Immediate update for zodiac select
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
                    ) : (
                        <div className="flex gap-2">
                            <input
                                type={dimension === 'born' ? "number" : "text"}
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                onBlur={handleInputSubmit}
                                onKeyDown={(e) => e.key === 'Enter' && handleInputSubmit()}
                                placeholder={t('filter_placeholder')}
                                className="border border-gray-300 rounded-md px-3 py-2 text-sm w-40"
                            />
                            <button
                                onClick={handleInputSubmit}
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
