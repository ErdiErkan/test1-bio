'use server'

import { signIn } from "@/lib/auth"
import { AuthError } from "next-auth"

// ✅ EKLENEN KISIM: AuthState tip tanımı
export interface AuthState {
  message: string
  error?: boolean
  success?: boolean
}

export async function loginAction(prevState: AuthState, formData: FormData): Promise<AuthState> {
  try {
    // redirect: false server-side'da tam desteklenmese de hata fırlatmasını önlemeye çalışırız
    // Başarılı olursa kod aşağıya devam eder.
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false, 
    })
    
    // Hata fırlatılmazsa başarı dönüyoruz
    return { success: true, message: "Giriş başarılı, yönlendiriliyor...", error: false }

  } catch (error) {
    // NextAuth/Next.js başarılı redirect'i bir hata olarak fırlatabilir (NEXT_REDIRECT)
    // Bu durumda hatayı yutup başarı dönmemiz gerekir.
    if (`${error}`.includes('NEXT_REDIRECT')) {
      return { success: true, message: "Giriş başarılı, yönlendiriliyor...", error: false }
    }

    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { message: "Email veya şifre hatalı.", error: true, success: false }
        default:
          return { message: "Giriş yapılamadı, lütfen tekrar deneyin.", error: true, success: false }
      }
    }
    
    // Beklenmedik hataları fırlat
    throw error
  }
}