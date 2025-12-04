// src/components/auth/LoginForm.tsx
'use client'

import { useActionState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { loginAction } from '@/actions/auth'
import { useRouter } from 'next/navigation' // Yönlendirme için eklendi

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
    >
      {pending ? (
        <>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
          Giriş yapılıyor...
        </>
      ) : (
        'Giriş Yap'
      )}
    </button>
  )
}

export default function LoginForm() {
  const router = useRouter()
  // initialState içine success alanını da ekliyoruz
  const [state, action] = useActionState(loginAction, { message: '', error: false, success: false })

  // State değiştiğinde çalışır: Eğer başarı varsa yönlendir
  useEffect(() => {
    if (state?.success) {
      // Refresh yaparak yönlendir ki session cookie tam algılansın
      window.location.href = '/admin'
      // Alternatif: router.push('/admin') -> router.refresh()
    }
  }, [state, router])

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <form action={action} className="space-y-6">
        
        {/* Hata Mesajı */}
        {state?.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm animate-pulse">
            {state.message}
          </div>
        )}

        {/* Başarı Mesajı (Yönlendirme sırasında kısa süreli görünür) */}
        {state?.success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm animate-pulse">
            {state.message}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Adresi
          </label>
          <input
            id="email"
            name="email" 
            type="email"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="admin@celebhub.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Şifre
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="••••••••"
          />
        </div>

        <SubmitButton />
      </form>
    </div>
  )
}