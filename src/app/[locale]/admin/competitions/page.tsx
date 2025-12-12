import { getCompetitions } from '@/actions/competitions'
import { Link } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { CompetitionStatus } from '@prisma/client'
import { Plus, Edit, Eye, Trophy } from 'lucide-react'

// Helper for status badge colors
const getStatusColor = (status: CompetitionStatus) => {
  switch (status) {
    case 'ONGOING': return 'bg-green-500 hover:bg-green-600'
    case 'UPCOMING': return 'bg-blue-500 hover:bg-blue-600'
    case 'COMPLETED': return 'bg-gray-500 hover:bg-gray-600'
    case 'DRAFT': return 'bg-yellow-500 hover:bg-yellow-600'
    case 'ARCHIVED': return 'bg-red-500 hover:bg-red-600'
    default: return 'bg-gray-500'
  }
}

export default async function AdminCompetitionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { locale } = await params
  const { page } = await searchParams

  const currentPage = Number(page) || 1
  const limit = 10

  const { items: competitions, metadata } = await getCompetitions({
    page: currentPage,
    limit,
    locale // Required for proper translation fallback
  })

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Competitions Management</h1>
        <Link href="/admin/add?type=competition">
          <Button className="min-h-[44px]">
            <Plus className="mr-2 h-4 w-4" />
            Create Competition
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Competitions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Contestants</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {competitions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No competitions found. Create your first one!
                  </TableCell>
                </TableRow>
              ) : (
                competitions.map((competition) => {
                  const translation = competition.translations[0]
                  const title = translation?.title || competition.slug

                  return (
                    <TableRow key={competition.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{title}</span>
                          <span className="text-xs text-muted-foreground font-mono">{competition.slug}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{competition.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(competition.status)}>
                          {competition.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Trophy className="h-4 w-4 text-yellow-500" />
                          <span>{competition._count?.entries || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          {competition.startDate ? (
                            <div>Start: {format(new Date(competition.startDate), 'dd MMM yyyy')}</div>
                          ) : null}
                          {competition.endDate ? (
                            <div>End: {format(new Date(competition.endDate), 'dd MMM yyyy')}</div>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/admin/edit/${competition.id}?type=competition`}>
                            <Button variant="outline" size="icon" className="h-8 w-8">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>

                          {competition.status !== 'DRAFT' && (
                            <Link href={`/competition/${translation?.slug || competition.slug}`} target="_blank">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {metadata.totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                asChild
              >
                <Link href={`/admin/competitions?page=${currentPage - 1}`}>
                  Previous
                </Link>
              </Button>
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {metadata.totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= metadata.totalPages}
                asChild
              >
                <Link href={`/admin/competitions?page=${currentPage + 1}`}>
                  Next
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
