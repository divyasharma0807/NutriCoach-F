import cloudinary from './config/cloudinary.js';
import fs from 'fs';
import path from 'path';

async function testSigned() {
  try {
    const dummyPdfPath = path.join(process.cwd(), 'dummy_test.pdf');
    fs.writeFileSync(dummyPdfPath, '%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');
    
    // Upload as raw
    const result = await cloudinary.uploader.upload(dummyPdfPath, {
      folder: 'nutricoach/medicals',
      resource_type: 'raw'
    });
    
    console.log("Uploaded RAW. URL:", result.secure_url);
    
    // Generate signed URL
    const url = cloudinary.utils.url(result.public_id, {
      resource_type: 'raw',
      type: 'upload',
      sign_url: true,
      secure: true,
      expires_at: Math.floor(Date.now() / 1000) + 3600 // expires in 1 hr
    });
    console.log("Signed URL:", url);
    
    // Fetch it
    const res = await globalThis.fetch(url);
    console.log("Fetch status:", res.status);
    const text = await res.text();
    console.log("Fetch body length:", text.length);
    
  } catch (err) {
    console.error("Error:", err);
  }
}
testSigned();
