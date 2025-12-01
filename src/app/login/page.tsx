import LoginForm from '@/components/auth/LoginForm'

export const metadata = {
  title: 'Giriş Yap - CelebHub',
  description: 'Admin paneline giriş yapın',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            CelebHub
          </h1>
          <p className="text-gray-600">Admin Paneli</p>
        </div>

        <LoginForm />

        <div className="text-center text-sm text-gray-500">
          <p>Varsayılan giriş bilgileri:</p>
          <p className="font-mono mt-1">admin@celebhub.com / Admin123!</p>
        </div>
      </div>
    </div>
  )
}
