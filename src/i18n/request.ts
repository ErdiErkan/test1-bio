import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  // `requestLocale` artık bir Promise döndürüyor (Next.js 15+)
  let locale = await requestLocale;

  // Geçerli bir locale değilse varsayılanı kullan
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    // JSON dosyalarının yolu "messages/en.json" ise "../../../messages" yerine "../../messages" olmalı.
    // Dosya yapınıza göre bu yolu kontrol edin: src/i18n/request.ts -> ../../messages
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});