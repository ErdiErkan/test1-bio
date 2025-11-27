import { ToastProvider } from '@/hooks/useToast'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  )
}
