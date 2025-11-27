export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <p className="text-center text-gray-600 text-sm">
          © {new Date().getFullYear()} CelebHub. Tüm hakları saklıdır.
        </p>
      </div>
    </footer>
  )
}
