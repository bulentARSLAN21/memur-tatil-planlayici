README

Aşağıdakini doğrudan README.md içine yapıştır:

# Memur Tatil Planlayıcı

Türkiye’deki resmî tatilleri, yaklaşan tatillere kalan gün sayılarını ve yıllık izin kullanarak tatil süresini nasıl uzatabileceğini gösteren **responsive web uygulaması**.

Bu proje, özellikle **memurlar ve kamu çalışanları** için geliştirilmiş bir **MVP (Minimum Viable Product)** sürümüdür.

---

## Proje Amacı

Bu uygulamanın amacı:

- Türkiye’deki resmî tatilleri tek ekranda göstermek
- Her tatile kaç gün kaldığını hesaplamak
- Yıllık izin günlerini daha verimli kullanmak için öneriler sunmak
- Kullanıcının kendi izin planını manuel olarak oluşturmasına izin vermek
- Seçilen izin planına göre toplam kesintisiz dinlenme süresini göstermek

---

## Özellikler

- 2026 Türkiye resmî tatil verileri
- Millî ve dinî tatilleri listeleme
- Yarım gün tatilleri ayrı gösterme
- Tatillere kalan gün sayısını hesaplama
- Akıllı izin önerileri
- Manuel izin günü seçimi
- Takvim üzerinden tıklayarak izin belirleme
- Seçili planı mini takvim üzerinde görselleştirme
- Responsive tasarım
- LocalStorage ile seçimleri kaydetme
- Hesapla butonu ile optimize edilmiş daha hızlı kullanım

---

## Kullanılan Teknolojiler

- **Next.js 16**
- **React**
- **TypeScript**
- **Tailwind CSS**
- **date-fns**
- **lucide-react**

---

## Proje Yapısı

```bash
src/
  app/
    page.tsx
    layout.tsx
    globals.css
  components/
    planner/
      YearMiniCalendar.tsx
    holiday/
    shared/
  data/
    holidays-2026.ts
  lib/
    date.ts
    planner.ts
  types/
    holiday.ts
Uygulama Nasıl Çalışır

Sistem 2026 yılına ait resmî tatil verilerini kullanır.

Hesaplama mantığı:

Hafta sonlarını otomatik olarak dinlenme günü kabul eder
Resmî tatilleri tam gün veya yarım gün olarak değerlendirir
Kullanıcının seçtiği yıllık izin günlerini plana ekler
Ortaya çıkan en uzun kesintisiz tatil bloğunu hesaplar
Tatillere yakın uygun iş günlerini aday izin günü olarak sunar
En az izin ile en fazla tatil sağlayan kombinasyonları önerir
Demo Senaryoları

Projede örnek kullanıcı profilleri bulunur:

Yeni memur
Orta seviye plan
Uzun tatil arayan kullanıcı

Bu senaryolar sayesinde farklı izin yapılarını hızlıca test edebilirsin.

Manuel İzin Planlama

Kullanıcı:

önerilen planlardan birini seçebilir
veya kendi izin günlerini manuel belirleyebilir
takvim üstünden uygun günlere tıklayarak seçim yapabilir

Seçim yapıldığında:

toplam dinlenme süresi hesaplanır
başlangıç ve bitiş tarihleri gösterilir
plan takvim üzerinde işaretlenir
Performans Optimizasyonları

Projede geliştirme ve kullanım performansını artırmak için:

ağır hesaplama işlemleri Hesapla butonuna bağlandı
mini takvim bileşeni lazy-load ile yüklendi
kullanıcı tercihleri localStorage ile saklandı
Kurulum

Projeyi yerelde çalıştırmak için:

git clone <REPO_URL>
cd memur-tatil-planlayici
npm install
npm run dev

Tarayıcıda aç:

http://localhost:3000

Eğer 3000 portu doluysa Next.js farklı bir port kullanabilir.

Gelecekte Eklenebilecek Özellikler
Çok yıllı tatil desteği
PDF çıktı alma
Paylaşılabilir tatil planı linki
Kullanıcı girişi
Favori planları kaydetme
PWA desteği
Mobil görünüm için özel iyileştirmeler
Öğretmen / farklı personel türleri için ayrı izin senaryoları
Yasal Not

Bu proje bilgilendirme amaçlıdır.
Nihai izin kullanımı kurum içi onay, mevzuat ve yönetici değerlendirmesine bağlıdır.

Geliştirici

Bülent ARSLAN

Yazılım, sağlık teknolojileri ve gerçek hayattaki problemlere yönelik dijital çözümler geliştirmeye odaklanan proje çalışması.




This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
