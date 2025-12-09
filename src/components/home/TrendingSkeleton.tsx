export default function TrendingSkeleton() {
    return (
        <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                <div className="w-48 h-8 bg-gray-200 rounded animate-pulse" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-32 sm:h-auto flex flex-row sm:flex-col animate-pulse">
                        <div className="w-1/3 sm:w-full h-full sm:h-48 bg-gray-200" />
                        <div className="w-2/3 sm:w-full p-4 space-y-3">
                            <div className="h-4 bg-gray-200 rounded w-3/4" />
                            <div className="h-3 bg-gray-200 rounded w-1/2" />
                            <div className="h-3 bg-gray-200 rounded w-1/4 mt-auto" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
