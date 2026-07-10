import cloudinary from './config/cloudinary.js';

async function testPdf() {
  try {
    const res = await cloudinary.api.resource('nutricoach/medicals/x24szfo0u2c5jnd44mod');
    console.log("Resource details:", res);
  } catch (err) {
    console.error("Error:", err);
  }
}
testPdf();
