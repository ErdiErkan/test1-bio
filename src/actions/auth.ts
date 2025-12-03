'use server'

import { signIn } from "@/lib/auth"
import { AuthError } from "next-auth"

export async function loginAction(prevState: string | undefined, formData: FormData) {
  try {
    // NextAuth'un kendi signIn fonksiyonunu çağırıyoruz.
    // Bu fonksiyon başarılı olursa otomatik olarak yönlendirme yapar (redirect).
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/admin", // Başarılı olursa buraya git
    })
  } catch (error) {
    // NextAuth redirect işlemi için aslında bir hata fırlatır,
    // bu yüzden AuthError dışındaki hataları tekrar fırlatmalıyız.
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Email veya şifre hatalı."
        default:
          return "Giriş yapılamadı, lütfen tekrar deneyin."
      }
    }
    throw error
  }
}