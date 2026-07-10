import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

// Generate dummy PDF
const dummyPdfPath = path.join(process.cwd(), 'dummy_test.pdf');
fs.writeFileSync(dummyPdfPath, '%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');

mongoose.connect('mongodb://nayakparth2257_db_user:hgbpwGfDfFLcXhBE@ac-be0mjze-shard-00-00.ym4yxvw.mongodb.net:27017,ac-be0mjze-shard-00-01.ym4yxvw.mongodb.net:27017,ac-be0mjze-shard-00-02.ym4yxvw.mongodb.net:27017/nutricoach?ssl=true&replicaSet=atlas-qkb1rx-shard-0&authSource=admin&retryWrites=true&w=majority')
  .then(async () => {
    const Client = mongoose.model('Client', new mongoose.Schema({}, { strict: false }));
    const client = await Client.findOne({ name: 'Deepti Sharma' });
    
    // Create token directly
    import('jsonwebtoken').then(async (jwt) => {
      const token = jwt.default.sign({ id: client._id, role: 'client' }, 'nutricoach_backend_2026_super_secure_jwt_secret_key_random_8492', { expiresIn: '30d' });
      
      const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
      let body = '';
      body += '--' + boundary + '\r\n';
      body += 'Content-Disposition: form-data; name="fullName"\r\n\r\n';
      body += 'Deepti Sharma\r\n';
      body += '--' + boundary + '\r\n';
      body += 'Content-Disposition: form-data; name="medicalPdf"; filename="dummy_test.pdf"\r\n';
      body += 'Content-Type: application/pdf\r\n\r\n';
      const pdfContent = fs.readFileSync(dummyPdfPath, 'utf8');
      body += pdfContent + '\r\n';
      body += '--' + boundary + '--\r\n';
      
      const profileRes = await globalThis.fetch('http://localhost:5001/api/clients/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`
        },
        body: body
      });
      
      const profileData = await profileRes.json();
      console.log("Profile Update Response:", profileData);
      process.exit(0);
    });
  });
