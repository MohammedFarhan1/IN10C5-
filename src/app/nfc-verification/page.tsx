import Header from '@/components/Header';
import Footer from '@/components/Footer';
import VerificationScannerClient from '@/app/seller/dashboard/verification/nfc/VerificationScannerClient';

export default async function PublicNfcVerificationPage({
  searchParams,
}: {
  searchParams?: Promise<{ code?: string }>;
}) {
  const query = await searchParams;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header showCategoryMenu={false} />
      <main className="container mx-auto px-4 py-10 flex-1 max-w-5xl">
        <VerificationScannerClient initialCode={query?.code || ''} backHref="/" />
      </main>
      <Footer />
    </div>
  );
}
