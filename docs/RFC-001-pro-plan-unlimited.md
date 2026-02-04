# RFC 001: Pro Plan Sınırsız Abonelik Entegrasyonu

| Metadata | Detay |
| :--- | :--- |
| **Yazar** | Trae AI (Assistant) |
| **Tarih** | 02.02.2026 |
| **Durum** | Tamamlandı (Implemented) |
| **Kapsam** | Frontend Logic (Hooks & Dashboard) |
| **İlgili Dosyalar** | `src/hooks/useSubscriptions.tsx`, `src/pages/Dashboard.tsx` |

## 1. Özet (Summary)
Bu değişiklik, **Pro (Premium)** plana sahip kullanıcıların abonelik ekleme sınırını kaldırmayı ve ücretsiz (Free) plan kullanıcıları için bu sınırı 3 ile sınırlandırmayı amaçlar. Daha önce Pro kullanıcılar da sistemsel bir hata nedeniyle limit kontrolüne takılıyordu.

## 2. Motivasyon (Motivation)
- **Problem:** Pro kullanıcılar ödeme yapmalarına rağmen "Limit Doldu" hatası alıyor ve yeni abonelik ekleyemiyordu.
- **Hedef:** Pro kullanıcı deneyimini iyileştirmek ve vaat edilen "Sınırsız Erişim" özelliğini teknik olarak garanti altına almak.
- **Kullanıcı Etkisi:** Pro kullanıcılar artık kesintisiz hizmet alırken, ücretsiz kullanıcılar freemium modeline uygun şekilde sınırlanacak.

## 3. Detaylı Tasarım (Detailed Design)

### 3.1. Hook Mantığı (`useSubscriptions.tsx`)
Abonelik ekleme iznini kontrol eden `canAddSubscription` fonksiyonu güncellendi.

**Eski Mantık:**
Sadece `isUnlimited` (Admin/Lifetime) ve `isTrialActive` kontrol ediliyordu. Pro durumu (`isPro`) kontrol edilmiyordu.

**Yeni Mantık:**
```typescript
const canAddSubscription = (): boolean => {
  // Unlimited users (admins or lifetime access) or Pro users have no limits
  if (isUnlimited || isPro) return true;
  
  // All other users are limited
  return subscriptions.length < MAX_TRIAL_SUBSCRIPTIONS;
};
```

### 3.2. Dashboard Entegrasyonu (`Dashboard.tsx`)
Dashboard sayfasındaki "Yeni Ekle" butonu ve modal açılış mantığı, hook'tan gelen güncel veriye göre hareket edecek şekilde doğrulandı.
- `useSubscription` hook'u import edildi.
- `isPro` değişkeni hook üzerinden çekildi.

### 3.3. UI Geri Bildirimi
Kullanıcı limit aşımı yaparsa (Sadece Free kullanıcılar için), gösterilen hata mesajı Türkçeleştirildi ve netleştirildi:
> "Ücretsiz planda maksimum 3 abonelik ekleyebilirsiniz. Sınırsız erişim için Pro'ya geçin."

## 4. Alternatif Çözümler (Alternative Solutions)
- **Backend Kontrolü (RLS):** Supabase RLS (Row Level Security) politikaları ile veritabanı seviyesinde ekleme engellenebilirdi. Ancak kullanıcı deneyimi (UX) açısından frontend'de engellemek ve uyarı göstermek daha hızlı geri bildirim sağlıyor. İdeal senaryoda her ikisi de olmalıdır.
- **Flag Yönetimi:** `isPro` kontrolünü `useAuth` içine taşımak düşünüldü ancak `useSubscription` hook'u zaten bu iş için özelleştiği için mevcut yapı korundu.

## 5. Riskler ve Kısıtlamalar (Drawbacks & Risks)
- **Senkronizasyon:** `isPro` bilgisinin Supabase'den geç gelmesi durumunda milisaniyelik bir gecikme ile buton aktif/pasif olabilir. (Loading state ile yönetiliyor).
- **Güvenlik:** Sadece frontend kontrolü yetersiz olabilir. Kötü niyetli kullanıcılar API çağrısını manipüle edebilir. (Gelecek fazda RLS Policy kontrol edilmeli).

## 6. Sonuç (Conclusion)
Yapılan değişiklikler ile Pro kullanıcıların yaşadığı "limit engeli" sorunu tamamen çözülmüştür. Kod tabanı artık Pro ve Free kullanıcı ayrımını doğru şekilde yapmaktadır.
