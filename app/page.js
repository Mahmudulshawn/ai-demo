"use client";
import { CldUploadWidget } from "next-cloudinary";
import { useState, useEffect, useCallback } from "react";
import {
  ReactCompareSlider,
  ReactCompareSliderImage,
} from "react-compare-slider";
import { Cloudinary } from "@cloudinary/url-gen";
import { format } from "@cloudinary/url-gen/actions/delivery";
import {
  generativeRestore,
  upscale,
  enhance,
} from "@cloudinary/url-gen/actions/effect";
import { improve } from "@cloudinary/url-gen/actions/adjust";

export default function Home() {
  const [resource, setResource] = useState(null);
  const [enhancedImage, setEnhancedImage] = useState(null);

  // Function to generate enhanced image and convert it to .webp
  const generateEnhancedImage = useCallback((imageUrl) => {
    const cld = new Cloudinary({
      cloud: {
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      },
    });

    // Get the public_id from the uploaded URL (remove the URL prefix for transformations)
    const publicId = imageUrl.split("/").pop().split(".")[0];

    // Apply transformation: convert to .webp and enhance the image
    const transformedImage = cld
      .image(publicId) // Create Cloudinary image instance using public_id
      .effect(upscale()) // Apply upscaling effect first
      .effect(enhance()) // Apply enhancement
      .effect(generativeRestore()); // Apply generative restore effect last

    return transformedImage.toURL(); // Generate and return the enhanced image URL
  }, []); // Empty dependency array ensures the function remains stable across renders

  // Load the uploaded image URL from local storage when the component mounts
  useEffect(() => {
    const storedImage = localStorage.getItem("uploadedImage");

    if (storedImage) {
      setResource(storedImage);
      const enhancedUrl = generateEnhancedImage(storedImage); // Generate enhanced image using the stored image URL
      setEnhancedImage(enhancedUrl);
    }
  }, [generateEnhancedImage]); // Include `generateEnhancedImage` in dependency array

  const handleImageUpload = async (result) => {
    console.log(result);
    const uploadedUrl = result?.info?.secure_url;
    setResource(uploadedUrl);
    localStorage.setItem("uploadedImage", uploadedUrl); // Save the image URL to local storage

    // Generate enhanced image immediately after upload
    const enhancedUrl = generateEnhancedImage(uploadedUrl); // Use the function to enhance the uploaded image
    setEnhancedImage(enhancedUrl);

    // const uploadedFile = result?.info?.file;

    // // Compression options to reduce file size to around 110kb
    // const options = {
    //   maxSizeMB: 0.11, // Target size of 110KB
    //   maxWidthOrHeight: 1000, // Adjust the dimensions if needed
    //   useWebWorker: true, // Use web workers to compress the image faster
    // };

    // try {
    //   const compressedFile = await imageCompression(uploadedFile, options); // Compress the image

    //   const uploadedUrl = URL.createObjectURL(compressedFile); // Get a local URL for the compressed image

    //   setResource(uploadedUrl);
    //   localStorage.setItem("uploadedImage", uploadedUrl);

    //   const enhancedUrl = generateEnhancedImage(uploadedUrl);
    //   setEnhancedImage(enhancedUrl);
    // } catch (error) {
    //   console.error("Error compressing the image:", error);
    // }
  };

  const handleRemoveImage = async () => {
    const publicId = resource.split("/").pop().split(".")[0]; // Extract public_id

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "https://localhost:3000"}/api/delete-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ publicId }), // Pass publicId to the API
      });

      if (!response.ok) {
        console.error(
          "Failed to remove image from Cloudinary:",
          response.status
        );
        return;
      }

      const data = await response.json(); // Parse JSON response

      if (data.success) {
        setResource(null);
        setEnhancedImage(null);
        localStorage.removeItem("uploadedImage"); // Clear from local storage
        console.log("Image removed from Cloudinary");
      } else {
        console.error("Failed to remove image from Cloudinary:", data.error);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <main className="min-h-screen w-full flex flex-col justify-start items-center gap-20 pt-20">
      <h1 className="text-6xl font-bold">Image Upload & Compare</h1>

      {/* Only show the upload button if no image has been uploaded yet */}
      {!resource && (
        <CldUploadWidget
          uploadPreset="testImage"
          onSuccess={(result) => handleImageUpload(result)}
        >
          {({ open }) => (
            <button
              onClick={() => open()}
              className="border bg-white text-black font-medium px-4 py-2 rounded-lg"
            >
              Upload an Image
            </button>
          )}
        </CldUploadWidget>
      )}

      {/* Display the uploaded image and the comparison slider */}
      {resource && enhancedImage && (
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-3xl font-medium">Compare Images</h2>
          <div className="w-[600px] h-[600px] rounded-lg overflow-hidden">
            <ReactCompareSlider
              itemOne={
                <ReactCompareSliderImage
                  src={resource} // Original uploaded image
                  alt="Original Image"
                  style={{ objectFit: "cover" }}
                />
              }
              itemTwo={
                <ReactCompareSliderImage
                  src={enhancedImage} // Enhanced image (in .webp format)
                  alt="Enhanced Image"
                  style={{ objectFit: "cover" }}
                />
              }
              style={{ width: "100%", height: "100%" }} // Makes the slider take the full width and height of the wrapper
            />
          </div>

          {/* Option to remove the image and upload again */}
          <button
            onClick={handleRemoveImage}
            className="border bg-red-500 text-white font-medium px-4 py-2 rounded-lg mt-4"
          >
            Remove Image
          </button>
        </div>
      )}
    </main>
  );
}
