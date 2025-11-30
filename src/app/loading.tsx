export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section Skeleton */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Title Skeleton */}
          <div className="h-12 md:h-16 bg-white/20 rounded-lg w-3/4 mx-auto mb-6 animate-pulse" />
          
          {/* Subtitle Skeleton */}
          <div className="h-6 bg-white/20 rounded-lg w-1/2 mx-auto mb-8 animate-pulse" />
          
          {/* SearchBar Skeleton */}
          <div className="max-w-2xl mx-auto">
            <div className="h-14 bg-white/30 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Content Section Skeleton */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Title */}
        <div className="h-8 bg-gray-200 rounded w-64 mb-6 animate-pulse" />
        
        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div 
              key={i} 
              className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100"
            >
              {/* Image Skeleton */}
              <div className="aspect-[3/4] bg-gray-200 animate-pulse" />
              
              {/* Content Skeleton */}
              <div className="p-4">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2 animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-1/4 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
