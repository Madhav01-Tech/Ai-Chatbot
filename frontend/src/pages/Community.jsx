import React, { useEffect, useState } from "react";
import { messageAPI } from "../utils/api";
import Loading from "./Loading";

const Community = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCommunityImages = async () => {
    setLoading(true);

    try {
      const response = await messageAPI.getPublishedImages();
      if (response?.success && Array.isArray(response.images)) {
        setImages(response.images);
      } else {
        setImages([]);
      }
    } catch (error) {
      console.error("Failed to fetch community images:", error);
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunityImages();
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="p-6 pt-12 xl:px-12 2xl:px-20 w-full mx-auto h-full overflow-y-auto">
      
      {/* Heading */}
      <h2 className="text-2xl font-semibold mb-8 text-gray-800 dark:text-gray-500">
        Community Images
      </h2>

      {images.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          No images published yet. Be the first to share your creation!
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          
          {images.map((img, index) => (
            
            <div
              key={index}
              className="relative rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 group"
            >
              
              {/* Image */}
              <img
                src={img.imageUrl}
                alt={`Community creation ${index + 1}`}
                className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-110 cursor-pointer"
                onClick={() => window.open(img.imageUrl, "_blank")}
              />

              {/* Overlay */}
              <div
                className="
                  absolute inset-0
                  bg-gradient-to-l
                  from-black/80 via-black/40 to-transparent
                  opacity-0 group-hover:opacity-100
                  transition-all duration-500
                  p-3
                  flex flex-col justify-between
                  pointer-events-none
                "
              >
                <div className="flex justify-between items-start pointer-events-auto">
                  
                
                  <a
                    href={img.imageUrl}
                    download={`community-image-${index + 1}.png`}
                    className="bg-white/90 text-gray-900 text-xs px-2 py-1 rounded-md hover:bg-white"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Download
                  </a>

                </div>
              </div>

            </div>
          ))}

        </div>
      )}
    </div>
  );
};

export default Community;