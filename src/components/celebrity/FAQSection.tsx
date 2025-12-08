'use client'

import { useState, useCallback } from 'react'
import type { FAQ } from '@/lib/types'
import { useTranslations } from 'next-intl'

interface FAQSectionProps {
  faqs: FAQ[]
  celebrityName: string
}

interface FAQItemProps {
  faq: FAQ
  isOpen: boolean
  onToggle: () => void
  index: number
}

function FAQItem({ faq, isOpen, onToggle, index }: FAQItemProps) {
  return (
    <div
      className="border-b border-gray-200 last:border-b-0"
      itemScope
      itemProp="mainEntity"
      itemType="https://schema.org/Question"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4 px-4 md:px-6
          text-left hover:bg-gray-50 transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset
          min-h-[56px] md:min-h-[64px]"
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${index}`}
        id={`faq-question-${index}`}
      >
        <span
          className="text-base md:text-lg font-medium text-gray-900 pr-4"
          itemProp="name"
        >
          {faq.question}
        </span>
        <span
          className={`flex-shrink-0 w-8 h-8 md:w-10 md:h-10 min-w-[44px] min-h-[44px]
            flex items-center justify-center
            rounded-full bg-blue-50 text-blue-600
            transition-transform duration-300
            ${isOpen ? 'rotate-180' : ''}`}
        >
          <svg
            className="w-5 h-5 md:w-6 md:h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </span>
      </button>

      <div
        id={`faq-answer-${index}`}
        role="region"
        aria-labelledby={`faq-question-${index}`}
        className={`overflow-hidden transition-all duration-300 ease-in-out
          ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
        itemScope
        itemProp="acceptedAnswer"
        itemType="https://schema.org/Answer"
      >
        <div
          className="px-4 md:px-6 pb-4 md:pb-6 text-gray-600 text-sm md:text-base leading-relaxed"
          itemProp="text"
        >
          {/* Preserve newlines in answer text */}
          {faq.answer.split('\n').map((paragraph, idx) => (
            <p key={idx} className={idx > 0 ? 'mt-3' : ''}>
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function FAQSection({ faqs, celebrityName }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0) // First one open by default
  const t = useTranslations('celebrity')
  const handleToggle = useCallback((index: number) => {
    setOpenIndex(prev => (prev === index ? null : index))
  }, [])

  // Don't render if no FAQs
  if (!faqs || faqs.length === 0) {
    return null
  }

  // Sort by display order
  const sortedFaqs = [...faqs].sort((a, b) => a.displayOrder - b.displayOrder)

  return (
    <section
      className="bg-white rounded-lg shadow-lg overflow-hidden"
      aria-labelledby="faq-section-title"
      itemScope
      itemType="https://schema.org/FAQPage"
    >
      {/* Section Header */}
      <div className="px-4 md:px-6 py-4 md:py-5 border-b border-gray-200 bg-gray-50">
        <h2
          id="faq-section-title"
          className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2"
        >
          <span className="text-2xl">❓</span>
          {t('faq_title')}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {t('faq_subtitle', { name: celebrityName })}
        </p>
      </div>

      {/* FAQ Items */}
      <div className="divide-y divide-gray-200">
        {sortedFaqs.map((faq, index) => (
          <FAQItem
            key={faq.id}
            faq={faq}
            isOpen={openIndex === index}
            onToggle={() => handleToggle(index)}
            index={index}
          />
        ))}
      </div>
    </section>
  )
}
