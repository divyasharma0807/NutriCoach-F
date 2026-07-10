async function check() {
  const url = 'https://res.cloudinary.com/wvkbefzt/image/upload/v1783711348/nutricoach/medicals/x24szfo0u2c5jnd44mod.png';
  const res = await globalThis.fetch(url);
  console.log("Status:", res.status);
  console.log("Content-Type:", res.headers.get('content-type'));
  const buffer = await res.arrayBuffer();
  console.log("Size:", buffer.byteLength);
}
check();
