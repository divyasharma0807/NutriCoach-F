
async function check() {
  const url = 'https://res.cloudinary.com/wvkbefzt/image/upload/v1783711348/nutricoach/medicals/x24szfo0u2c5jnd44mod.pdf';
  const res = await globalThis.fetch(url);
  console.log("Status:", res.status);
  console.log("Content-Type:", res.headers.get('content-type'));
  const buffer = await res.arrayBuffer();
  console.log("Size:", buffer.byteLength);
  
  // What are the first few bytes?
  const view = new Uint8Array(buffer);
  const head = String.fromCharCode(...view.slice(0, 15));
  console.log("Header:", head);
}
check();
