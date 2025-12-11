'use client';

import { useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { CompetitionType } from '@prisma/client';
import { useTranslations } from 'next-intl';

export default function CompetitionFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const t = useTranslations('competitions.filters');

  const [type, setType] = useState(searchParams.get('type') || '');
  const [year, setYear] = useState(searchParams.get('year') || '');

  const applyFilters = (newType: string, newYear: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (newType) params.set('type', newType);
    else params.delete('type');

    if (newYear) params.set('year', newYear);
    else params.delete('year');

    // Reset page on filter change
    params.delete('page');

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setType(val);
    applyFilters(val, year);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setYear(val);
    applyFilters(type, val);
  };

  const clearFilters = () => {
    setType('');
    setYear('');
    router.push(pathname);
  };

  // Generate last 10 years
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-col sm:flex-row gap-4 items-center">
      <div className="w-full sm:w-auto">
        <select
          value={type}
          onChange={handleTypeChange}
          className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
        >
          <option value="">All Types</option>
          {Object.keys(CompetitionType).map((t) => (
            <option key={t} value={t}>{t.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      <div className="w-full sm:w-auto">
        <select
          value={year}
          onChange={handleYearChange}
          className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
        >
          <option value="">All Years</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {(type || year) && (
        <button
          onClick={clearFilters}
          className="text-sm text-gray-500 hover:text-gray-700 underline ml-auto"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}
