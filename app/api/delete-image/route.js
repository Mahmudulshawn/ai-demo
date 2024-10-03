import cloudinary from 'cloudinary';
import { NextResponse } from 'next/server';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const POST = async (req, res) => {
  try {
    const { publicId } = await req.json(); // Parse JSON body from request

    // Call Cloudinary to delete the image by public ID
    const result = await cloudinary.v2.uploader.destroy(publicId);

    if (result.result !== 'ok') {
      return NextResponse.json({ success: false, error: "Failed to delete image" }, { status: 500 });
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Error deleting image:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
};
