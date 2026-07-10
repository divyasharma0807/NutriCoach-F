import https from 'https';
import fs from 'fs';

const url = 'https://res.cloudinary.com/wvkbefzt/raw/upload/v1783689489/nutricoach/medicals/ja7rasxtoofrqjiocqpp.pdf';
const file = fs.createWriteStream('test.pdf');
https.get(url, function(response) {
  response.pipe(file);
  file.on('finish', function() {
    file.close();
    console.log('Downloaded');
    // read first 100 bytes
    const buf = fs.readFileSync('test.pdf');
    console.log(buf.toString('utf8', 0, 100));
    process.exit(0);
  });
});
