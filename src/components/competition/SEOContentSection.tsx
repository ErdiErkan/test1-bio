interface SEOContentSectionProps {
  content: string;
}

export default function SEOContentSection({ content }: SEOContentSectionProps) {
  return (
    <section className="bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
            className="prose prose-indigo max-w-none text-gray-600"
            dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </section>
  );
}
