'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createCompetition } from '@/actions/competitions';
import { uploadCompetitionImage } from '@/actions/upload-competition';
import { CompetitionType, CompetitionScope, CompetitionStatus } from '@prisma/client';
import Image from 'next/image';

interface CompetitionFormProps {
  locale: string;
}

export default function CompetitionForm({ locale }: CompetitionFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    common: {
      type: 'BEAUTY_PAGEANT' as CompetitionType,
      scope: 'GLOBAL' as CompetitionScope,
      status: 'DRAFT' as CompetitionStatus,
      year: new Date().getFullYear(),
      edition: undefined as number | undefined,
      eventDate: '',
      country: '',
      city: '',
      venue: '',
      coverImage: '',
      logoImage: '',
      isFeatured: false,
      publishedLanguages: [] as string[],
    },
    translations: {
      EN: { name: '', description: '', seoContent: '', metaTitle: '', metaDescription: '' },
      TR: { name: '', description: '', seoContent: '', metaTitle: '', metaDescription: '' },
      ES: { name: '', description: '', seoContent: '', metaTitle: '', metaDescription: '' },
      IT: { name: '', description: '', seoContent: '', metaTitle: '', metaDescription: '' },
      PT: { name: '', description: '', seoContent: '', metaTitle: '', metaDescription: '' },
      FR: { name: '', description: '', seoContent: '', metaTitle: '', metaDescription: '' },
      DE: { name: '', description: '', seoContent: '', metaTitle: '', metaDescription: '' },
    } as Record<string, any>
  });

  const [activeLangTab, setActiveLangTab] = useState('EN');
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);

  const handleCommonChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      common: { ...prev.common, [field]: value }
    }));
  };

  const handleTranslationChange = (lang: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      translations: {
        ...prev.translations,
        [lang]: { ...prev.translations[lang], [field]: value }
      }
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'logo') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(type);
    const formData = new FormData();
    formData.append('file', file);

    const result = await uploadCompetitionImage(formData, type);

    if (result.success && result.imagePath) {
      handleCommonChange(type === 'cover' ? 'coverImage' : 'logoImage', result.imagePath);
    } else {
      alert(result.error || 'Upload failed');
    }
    setUploadingImage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Filter out empty translations
    const cleanTranslations: Record<string, any> = {};
    Object.entries(formData.translations).forEach(([lang, data]) => {
      if (data.name.trim()) {
        cleanTranslations[lang] = data;
      }
    });

    if (Object.keys(cleanTranslations).length === 0) {
      setError('At least one language (Name) is required');
      setIsSubmitting(false);
      return;
    }

    const payload = {
      common: {
        ...formData.common,
        publishedLanguages: Object.keys(cleanTranslations)
      },
      translations: cleanTranslations
    };

    const result = await createCompetition(payload);

    if (result.success) {
      router.push(`/admin/competitions`);
      router.refresh();
    } else {
      setError(result.error || 'Failed to create competition');
    }
    setIsSubmitting(false);
  };

  const tabs = [
    { id: 1, name: 'Basic Info' },
    { id: 2, name: 'Translations' },
    { id: 3, name: 'SEO & Media' }
  ];

  return (
    <div className="bg-white shadow rounded-lg p-6">
      {/* Steps/Tabs */}
      <div className="mb-8 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStep(tab.id)}
              className={`
                whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm
                ${step === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  value={formData.common.type}
                  onChange={(e) => handleCommonChange('type', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 min-h-[44px]"
                >
                  {Object.keys(CompetitionType).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Scope</label>
                <select
                  value={formData.common.scope}
                  onChange={(e) => handleCommonChange('scope', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 min-h-[44px]"
                >
                  {Object.keys(CompetitionScope).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Year</label>
                <input
                  type="number"
                  value={formData.common.year}
                  onChange={(e) => handleCommonChange('year', parseInt(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={formData.common.status}
                  onChange={(e) => handleCommonChange('status', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 min-h-[44px]"
                >
                  {Object.keys(CompetitionStatus).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                 <label className="block text-sm font-medium text-gray-700">Event Date</label>
                 <input
                    type="date"
                    value={formData.common.eventDate}
                    onChange={(e) => handleCommonChange('eventDate', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 min-h-[44px]"
                 />
              </div>

              <div>
                 <label className="block text-sm font-medium text-gray-700">Country Code (ISO 2)</label>
                 <input
                    type="text"
                    maxLength={2}
                    value={formData.common.country}
                    onChange={(e) => handleCommonChange('country', e.target.value.toUpperCase())}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 min-h-[44px]"
                 />
              </div>

              <div>
                 <label className="block text-sm font-medium text-gray-700">City</label>
                 <input
                    type="text"
                    value={formData.common.city}
                    onChange={(e) => handleCommonChange('city', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 min-h-[44px]"
                 />
              </div>

              <div>
                 <label className="block text-sm font-medium text-gray-700">Venue</label>
                 <input
                    type="text"
                    value={formData.common.venue}
                    onChange={(e) => handleCommonChange('venue', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 min-h-[44px]"
                 />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.common.isFeatured}
                  onChange={(e) => handleCommonChange('isFeatured', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">Is Featured?</label>
              </div>
            </div>

            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 min-h-[44px]"
                >
                    Next: Translations
                </button>
            </div>
          </div>
        )}

        {/* Step 2: Translations */}
        {step === 2 && (
          <div>
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-4 overflow-x-auto">
                {Object.keys(formData.translations).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setActiveLangTab(lang)}
                    className={`
                      whitespace-nowrap pb-2 px-1 border-b-2 font-medium text-sm
                      ${activeLangTab === lang
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'}
                    `}
                  >
                    {lang}
                  </button>
                ))}
              </nav>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name ({activeLangTab})</label>
                <input
                  type="text"
                  value={formData.translations[activeLangTab].name}
                  onChange={(e) => handleTranslationChange(activeLangTab, 'name', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 min-h-[44px]"
                  placeholder="e.g., Miss World 2024"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description ({activeLangTab})</label>
                <textarea
                  rows={4}
                  value={formData.translations[activeLangTab].description}
                  onChange={(e) => handleTranslationChange(activeLangTab, 'description', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-between">
                <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 min-h-[44px]"
                >
                    Back
                </button>
                <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 min-h-[44px]"
                >
                    Next: SEO & Media
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: SEO & Media */}
        {step === 3 && (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Media Uploads */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image (1200x630)</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                            {formData.common.coverImage ? (
                                <div className="relative h-40 w-full mb-2">
                                    <Image
                                        src={formData.common.coverImage}
                                        alt="Cover"
                                        fill
                                        className="object-cover rounded-md"
                                        unoptimized // Nginx handles caching, Next.js optimization skipped
                                    />
                                </div>
                            ) : (
                                <div className="text-gray-500 text-sm mb-2">No image selected</div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, 'cover')}
                                disabled={uploadingImage === 'cover'}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                            />
                            {uploadingImage === 'cover' && <span className="text-xs text-indigo-600">Uploading...</span>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Logo (400x400)</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                            {formData.common.logoImage ? (
                                <div className="relative h-40 w-40 mx-auto mb-2">
                                    <Image
                                        src={formData.common.logoImage}
                                        alt="Logo"
                                        fill
                                        className="object-contain rounded-md"
                                        unoptimized
                                    />
                                </div>
                            ) : (
                                <div className="text-gray-500 text-sm mb-2">No logo selected</div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, 'logo')}
                                disabled={uploadingImage === 'logo'}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                            />
                            {uploadingImage === 'logo' && <span className="text-xs text-indigo-600">Uploading...</span>}
                        </div>
                    </div>
                </div>

                {/* SEO Fields per Language */}
                <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">SEO Settings ({activeLangTab})</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Meta Title</label>
                            <input
                                type="text"
                                value={formData.translations[activeLangTab].metaTitle}
                                onChange={(e) => handleTranslationChange(activeLangTab, 'metaTitle', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 min-h-[44px]"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Meta Description</label>
                            <textarea
                                rows={2}
                                value={formData.translations[activeLangTab].metaDescription}
                                onChange={(e) => handleTranslationChange(activeLangTab, 'metaDescription', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">SEO Content (Rich Text)</label>
                            <textarea
                                rows={6}
                                value={formData.translations[activeLangTab].seoContent}
                                onChange={(e) => handleTranslationChange(activeLangTab, 'seoContent', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                placeholder="HTML or Markdown content for the bottom of the page"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-between pt-4">
                    <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 min-h-[44px]"
                    >
                        Back
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 min-h-[44px] disabled:opacity-50"
                    >
                        {isSubmitting ? 'Creating...' : 'Create Competition'}
                    </button>
                </div>
            </div>
        )}
      </form>
    </div>
  );
}
