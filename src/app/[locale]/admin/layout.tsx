import AdminNavbar from '@/components/admin/AdminNavbar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Menüyü en tepeye, sabit olarak ekliyoruz */}
      <AdminNavbar />

      {/* Sayfa içeriği */}
      <main>
        {children}
      </main>
    </div>
  )
}