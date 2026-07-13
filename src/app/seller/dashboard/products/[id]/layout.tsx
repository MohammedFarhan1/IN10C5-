export default async function ProductIdLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  // Await params to satisfy Next.js 15 segment resolution requirements
  await params;
  return <>{children}</>;
}
