'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginForm() {
  const router = useRouter()

  const [callbackUrl, setCallbackUrl] = useState('/admin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // URL parametrelerini client-side'da güvenli şekilde al
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const url = params.get('callbackUrl')
      if (url) setCallbackUrl(url)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // 1. CSRF Token'ı al
      const csrfRes = await fetch('/api/auth/csrf', { method: 'GET' })
      if (!csrfRes.ok) {
        throw new Error('CSRF token alınamadı')
      }

      const csrfData = await csrfRes.json()
      const csrfToken = csrfData?.csrfToken

      if (!csrfToken) {
        throw new Error('CSRF token bulunamadı')
      }

      // 2. Manuel giriş isteği gönder (next-auth/react bağımlılığı olmadan)
      const res = await fetch('/api/auth/callback/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          csrfToken,
          email,
          password,
          json: 'true',
        }),
      })

      const data = await res.json().catch(() => ({}))

      // NextAuth bazen 200 dönse bile body içinde hata dönebiliyor
      if (!res.ok || data?.error) {
        throw new Error(data?.message || 'Giriş başarısız')
      }

      // Hata kontrolü (NextAuth bazen 200 dönüp url içinde error parametresi verebilir)
      if (data?.url && typeof data.url === 'string' && data.url.includes('error=')) {
        setError('Email veya şifre hatalı')
        setIsLoading(false)
        return
      }

      // 3. Başarılı giriş sonrası: önce client state'i güncelle, sonra tam sayfa yönlendir
      const targetUrl =
        (data?.url && typeof data.url === 'string' ? data.url : callbackUrl) || '/admin'

      // App Router state'ini güncelle
      router.refresh()

      // Tam sayfa yenileme + geçmişi kirletmemek için replace
      window.location.replace(targetUrl)
    } catch (err) {
      console.error('Login error:', err)
      setError('Email veya şifre hatalı')
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Adresi
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="ornek@email.com"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Şifre
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="••••••••"
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Giriş yapılıyor...
            </span>
          ) : (
            'Giriş Yap'
          )}
        </button>
      </form>
    </div>
  )
}
