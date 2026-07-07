import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 pt-24 sm:pt-28">
      <div className="text-center max-w-md">
        <p className="text-6xl font-bold text-primary-600">404</p>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Sidan kunde inte hittas</h1>
        <p className="mt-2 text-gray-600">
          Sidan du letar efter finns inte eller har flyttats.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
        >
          Tillbaka till startsidan
        </Link>
      </div>
    </div>
  );
}
