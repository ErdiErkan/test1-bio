'use client';

import { useState, useRef, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import Image from 'next/image';
import { searchCelebritiesForCompetition } from '@/actions/competitions';

interface Celebrity {
  id: string;
  name: string;
  profession: string | null;
  nationality: string | null;
  image: string | null;
}

interface ContestantSearchProps {
  competitionId: string;
  locale: string;
  onSelect: (celebrity: Celebrity) => void;
}

export default function ContestantSearch({ competitionId, locale, onSelect }: ContestantSearchProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, 300);
  const [results, setResults] = useState<Celebrity[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function search() {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const data = await searchCelebritiesForCompetition(debouncedQuery, competitionId, locale);
        setResults(data);
        setIsOpen(true);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    search();
  }, [debouncedQuery, competitionId, locale]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (celebrity: Celebrity) => {
    onSelect(celebrity);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">Add Contestant</label>
      <input
        type="text"
        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 min-h-[44px]"
        placeholder="Search celebrity by name..."
        value={query}
        onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
        }}
      />

      {isOpen && (results.length > 0 || loading) && (
        <div className="absolute z-10 w-full mt-1 bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          {loading ? (
            <div className="px-4 py-2 text-gray-500">Searching...</div>
          ) : (
            results.map((celebrity) => (
              <div
                key={celebrity.id}
                className="cursor-pointer hover:bg-indigo-50 px-4 py-2 flex items-center"
                onClick={() => handleSelect(celebrity)}
              >
                <div className="flex-shrink-0 h-10 w-10 relative mr-3">
                  {celebrity.image ? (
                    <Image
                      src={celebrity.image}
                      alt={celebrity.name}
                      fill
                      className="rounded-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 text-xs">IMG</span>
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{celebrity.name}</div>
                  <div className="text-xs text-gray-500">
                    {celebrity.profession} • {celebrity.nationality}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
