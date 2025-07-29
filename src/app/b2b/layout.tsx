import NavBar from '@/components/NavBar';

export default function B2BLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavBar />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
} 