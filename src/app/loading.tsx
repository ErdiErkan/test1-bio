export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="text-center">
        <div className="mb-8">
          <div className="inline-block animate-bounce text-6xl mb-4">
            ⭐
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            CelebHub
          </h2>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>

        <div className="flex items-center justify-center space-x-2">
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
          <div className="w-3 h-3 bg-purple-600 rounded-full animate-pulse delay-75"></div>
          <div className="w-3 h-3 bg-pink-600 rounded-full animate-pulse delay-150"></div>
        </div>
      </div>
    </div>
  )
}
