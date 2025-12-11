'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CompetitionType, CompetitionStatus, CompetitionScope } from '@prisma/client';
import { deleteCompetition } from '@/actions/competitions';

interface CompetitionDTO {
  id: string;
  name: string;
  slug: string;
  type: CompetitionType;
  status: CompetitionStatus;
  scope: CompetitionScope;
  year: number;
  eventDate?: string | null;
  country?: string | null;
  viewCount: number;
}

interface CompetitionsTableProps {
  competitions: CompetitionDTO[];
  locale: string;
}

export default function CompetitionsTable({ competitions, locale }: CompetitionsTableProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this competition?')) return;

    setIsDeleting(id);
    const result = await deleteCompetition(id);
    setIsDeleting(null);

    if (result.success) {
      router.refresh();
    } else {
      alert('Failed to delete competition');
    }
  };

  const getStatusBadge = (status: CompetitionStatus) => {
    const colors = {
      DRAFT: 'bg-gray-100 text-gray-800',
      UPCOMING: 'bg-blue-100 text-blue-800',
      ONGOING: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-purple-100 text-purple-800',
      ARCHIVED: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colors[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type / Scope
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Year / Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Views
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {competitions.map((competition) => (
              <tr key={competition.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{competition.name}</div>
                  <div className="text-sm text-gray-500">/{competition.slug}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{competition.type}</div>
                  <div className="text-sm text-gray-500">{competition.scope}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{competition.year}</div>
                  <div className="text-sm text-gray-500">
                    {competition.eventDate ? new Date(competition.eventDate).toLocaleDateString() : '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(competition.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {competition.viewCount.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/competitions/edit/${competition.id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(competition.id)}
                      disabled={isDeleting === competition.id}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                    >
                      {isDeleting === competition.id ? '...' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {competitions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                  No competitions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
