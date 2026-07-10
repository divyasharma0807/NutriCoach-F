import cloudinary from './config/cloudinary.js';
import fs from 'fs';

async function run() {
  fs.writeFileSync('test_dummy.pdf', '%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');
  try {
    const resAuto = await cloudinary.uploader.upload('test_dummy.pdf', { folder: 'nutricoach/test', resource_type: 'auto' });
    console.log('AUTO URL:', resAuto.secure_url);
    console.log('AUTO resource_type:', resAuto.resource_type);
  } catch(e) { console.error('AUTO error:', e.message); }
  process.exit(0);
}
run();
