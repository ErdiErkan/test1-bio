import CompetitionForm from '@/components/admin/CompetitionForm';

export default async function CreateCompetitionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Competition</h1>
          <p className="text-gray-600 mt-2">Add a new competition, pageant, or award event.</p>
        </div>

        <CompetitionForm locale={locale} />
      </div>
    </div>
  );
}
