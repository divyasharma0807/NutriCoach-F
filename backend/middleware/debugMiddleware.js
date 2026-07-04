export const debugLog = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    console.log(`\n[DEBUG] ${req.method} ${req.originalUrl}`);
    console.log(`[DEBUG] Authenticated User ID:`, req.user ? req.user._id : 'None');
    console.log(`[DEBUG] Request Body:`, req.body);
  }
  if (req.method === 'GET') {
    console.log(`\n[DEBUG] GET ${req.originalUrl}`);
    console.log(`[DEBUG] Authenticated User ID:`, req.user ? req.user._id : 'None');
    console.log(`[DEBUG] Query/Filter Parameters:`, req.query);
  }
  
  const originalJson = res.json;
  res.json = function (body) {
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && body && body.success) {
      console.log(`[DEBUG] Saved Document:`, body.data);
    }
    if (req.method === 'GET' && body && body.success) {
      let count = 0;
      if (Array.isArray(body.data)) count = body.data.length;
      else if (body.data && typeof body.data === 'object') {
         count = Object.keys(body.data).length; 
      }
      console.log(`[DEBUG] Returned data elements count:`, count);
    }
    return originalJson.call(this, body);
  };
  next();
};
