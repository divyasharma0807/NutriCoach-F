import fs from 'fs';
import path from 'path';

// 1. Create a dummy pdf
const dummyPdfPath = path.join(process.cwd(), 'dummy_test.pdf');
fs.writeFileSync(dummyPdfPath, '%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');

// 2. Login as Divya to get token
const loginRes = await fetch('http://localhost:5001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone: '9876543210', password: 'password123', role: 'client' })
});
const loginData = await loginRes.json();
if (!loginData.token) {
  console.log("Login failed:", loginData);
  process.exit(1);
}
const token = loginData.token;

// 3. Upload Profile using fetch and manual multipart/form-data
const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
let body = '';
body += '--' + boundary + '\r\n';
body += 'Content-Disposition: form-data; name="fullName"\r\n\r\n';
body += 'Divya Sharma\r\n';
body += '--' + boundary + '\r\n';
body += 'Content-Disposition: form-data; name="medicalPdf"; filename="dummy_test.pdf"\r\n';
body += 'Content-Type: application/pdf\r\n\r\n';
const pdfContent = fs.readFileSync(dummyPdfPath, 'utf8');
body += pdfContent + '\r\n';
body += '--' + boundary + '--\r\n';

const profileRes = await fetch('http://localhost:5001/api/clients/profile', {
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
