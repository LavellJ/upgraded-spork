import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

interface Asset {
  id: string;
  assetId: string;
  name: string;
  description: string;
  filePath: string;
  assetType: string;
  category: string;
  subject: string | null;
  ageGroup: string | null;
  tags: string[];
}

export default function AssetsGallery() {
  const { data: assets, isLoading } = useQuery<Asset[]>({
    queryKey: ['/api/assets'],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
            <p className="mt-4 text-amber-700">Loading assets...</p>
          </div>
        </div>
      </div>
    );
  }

  const groupedAssets = assets?.reduce((groups, asset) => {
    const category = asset.category || 'uncategorized';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(asset);
    return groups;
  }, {} as Record<string, Asset[]>) || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="flex items-center gap-2 text-amber-700 hover:text-amber-800 transition-colors">
            <ArrowLeft size={20} />
            Back to Home
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-amber-800 mb-2">
            Geometric Animal Assets
          </h1>
          <p className="text-amber-600 text-lg">
            All the generated images now stored in the database
          </p>
        </div>

        {/* Assets Grid */}
        {Object.entries(groupedAssets).map(([category, categoryAssets]) => (
          <div key={category} className="mb-12">
            <h2 className="text-2xl font-semibold text-amber-800 mb-6 capitalize">
              {category.replace('-', ' ')} ({categoryAssets.length} assets)
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {categoryAssets.map((asset) => (
                <div 
                  key={asset.id} 
                  className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-4"
                >
                  {/* Image */}
                  <div className="aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                    <img
                      src={`/@assets/generated_images/${asset.filePath.split('/').pop()}`}
                      alt={asset.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `
                            <div class="text-center text-gray-500 p-4">
                              <div class="text-2xl mb-2">🖼️</div>
                              <div class="text-sm">Image not found</div>
                              <div class="text-xs mt-1 text-gray-400">${asset.filePath}</div>
                            </div>
                          `;
                        }
                      }}
                    />
                  </div>

                  {/* Asset Info */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-gray-800 text-sm">
                      {asset.name}
                    </h3>
                    
                    {asset.description && (
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {asset.description}
                      </p>
                    )}

                    {/* Metadata */}
                    <div className="space-y-1">
                      {asset.subject && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {asset.subject}
                          </span>
                        </div>
                      )}
                      
                      {asset.ageGroup && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            {asset.ageGroup}
                          </span>
                        </div>
                      )}

                      {asset.tags && asset.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {asset.tags.slice(0, 3).map((tag, index) => (
                            <span 
                              key={index}
                              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                          {asset.tags.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{asset.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Asset ID */}
                    <div className="text-xs text-gray-400 mt-2 font-mono">
                      ID: {asset.assetId}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {assets && assets.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📁</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Assets Found</h3>
            <p className="text-gray-500">No assets have been added to the database yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}