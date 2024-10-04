"use client";
import { CldUploadWidget } from "next-cloudinary";
import { useState, useEffect, useCallback } from "react";
import {
  ReactCompareSlider,
  ReactCompareSliderImage,
} from "react-compare-slider";
import { Cloudinary } from "@cloudinary/url-gen";
import {
  generativeRestore,
  upscale,
  enhance,
} from "@cloudinary/url-gen/actions/effect";
import { Resize } from "@cloudinary/url-gen/actions/resize";
import useDownloader from "react-use-downloader";

export default function Home() {
  const [resource, setResource] = useState(null);
  const [enhancedImage, setEnhancedImage] = useState(null);

  const {download} = useDownloader();

  // Sequentially apply transformations one by one
  const generateEnhancedImage = useCallback(async (imageUrl) => {
    const cld = new Cloudinary({
      cloud: {
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      },
    });

    const publicId = imageUrl.split("/").pop().split(".")[0];

    try {
      // Start with the original image
      let transformedImage = cld.image(publicId);

      transformedImage = transformedImage.resize(
        Resize.fit().width(320).height(180)
      );
      console.log(`Image resized to 320 X 180 px.`);

      // Try to apply the 'upscale' effect
      transformedImage = transformedImage.effect(upscale());
      console.log("Upscale applied successfully.");

      // Try to apply the 'enhance' effect
      transformedImage = transformedImage.effect(enhance());
      console.log("Enhance applied successfully.");

      // Try to apply the 'generativeRestore' effect
      transformedImage = transformedImage.effect(generativeRestore());
      console.log("Generative Restore applied successfully.");

      // Try to apply the 'sharpen' effect
      // transformedImage = transformedImage.effect(sharpen(1500));
      // console.log("Sharpen applied successfully.");
      
      return transformedImage.toURL(); // Return the transformed image URL (or null if there was a fatal error)
    } catch (error) {
      console.error("Transformation error:", error);
      // return transformedImage.toURL();
      return null; // Return null if there was a fatal error
    }
  }, []);

  // Load the uploaded image URL from local storage when the component mounts
  useEffect(() => {
    const storedImage = localStorage.getItem("uploadedImage");

    if (storedImage) {
      setResource(storedImage);
      generateEnhancedImage(storedImage).then((enhancedUrl) => {
        setEnhancedImage(enhancedUrl);
      });
    }
  }, [generateEnhancedImage]);

  const handleImageUpload = async (result) => {
    if (!result) {
      console.log("upload failed");
      return;
    }
    const uploadedUrl = result?.info?.secure_url;

    setResource(uploadedUrl);
    localStorage.setItem("uploadedImage", uploadedUrl);

    // Generate enhanced image immediately after upload
    generateEnhancedImage(uploadedUrl).then((enhancedUrl) => {
      setEnhancedImage(enhancedUrl);
    });
  };

  const handleRemoveImage = async () => {
    const publicId = resource.split("/").pop().split(".")[0];

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/delete-image`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ publicId }),
        }
      );

      if (!response.ok) {
        console.error("Failed to remove images from Cloudinary:", response.status);
        return;
      }

      const data = await response.json();

      if (data.success) {
        setResource(null);
        setEnhancedImage(null);
        localStorage.removeItem("uploadedImage");
        console.log("Images removed from Cloudinary");
      } else {
        console.error("Failed to remove images from Cloudinary:", data.error);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };
  
  const downloadEnhancedImage = () => {
    if (enhancedImage) {
      download(enhancedImage, "ImageFlux-enhanced-image.jpg");
    } else {
      console.log("Enhanced image not found");
    }
  };

  return (
    <main className="min-h-screen w-full flex flex-col justify-start items-center gap-20 pt-20 px-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-6xl font-bold max-md:text-xl text-center">ImageFlux Image Upload & Compare</h1>
        <p className="max-md:text-sm text-xl text-center"><span className="bg-red-500 text-white">Note:</span> It works the best with single subject image like a portrait and specially a small sized and grainy image.</p>
      </div>

      {!resource && (
        <CldUploadWidget
          uploadPreset="testImage"
          onSuccess={(result) => handleImageUpload(result)}
        >
          {({ open }) => (
            <button
              onClick={() => open()}
              className="border bg-white text-black font-medium px-4 py-2 rounded-lg max-md:text-sm"
            >
              Upload an Image
            </button>
          )}
        </CldUploadWidget>
      )}

      {resource && enhancedImage && (
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-3xl font-medium">Compare Images</h2>
          <div className="w-[600px] h-[600px] rounded-lg overflow-hidden max-md:w-[300px] max-md:h-[300px] ">
            <ReactCompareSlider
              itemOne={
                <ReactCompareSliderImage
                  src={resource}
                  alt="Original Image"
                  style={{ objectFit: "cover" }}
                />
              }
              itemTwo={
                <ReactCompareSliderImage
                  src={enhancedImage ? enhancedImage : resource}
                  alt="Enhanced Image"
                  style={{ objectFit: "cover" }}
                />
              }
              style={{ width: "100%", height: "100%" }}
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleRemoveImage}
              className=" bg-red-500 hover:bg-red-500/50 text-white font-medium px-2 py-2 rounded-lg mt-4 max-md:text-sm"
            >
              Remove Image
            </button>

            <button
              onClick={downloadEnhancedImage}
              className=" bg-blue-500 hover:bg-blue-500/50 text-white font-medium px-2 py-2 rounded-lg mt-4 max-md:text-sm"
            >
              Download Enhanced Image
            </button>
          </div>
        </div>
      )}
    </main>
  );
}