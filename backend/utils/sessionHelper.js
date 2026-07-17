export const parseSessionDateTime = (dateStr, timeStr) => {
  try {
    if (!dateStr || !timeStr) return new Date(0);
    
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return new Date(0);
    
    let [ , hours, minutes, period ] = match;
    hours = parseInt(hours, 10);
    minutes = parseInt(minutes, 10);
    
    if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
    if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
    
    const [year, month, day] = dateStr.split('-');
    return new Date(year, month - 1, day, hours, minutes);
  } catch (err) {
    return new Date(0);
  }
};

export const isSessionInFuture = (dateStr, timeStr) => {
  try {
    if (!dateStr || !timeStr) return true;
    
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return true; // keep if invalid format
    
    let [ , hours, minutes, period ] = match;
    hours = parseInt(hours, 10);
    minutes = parseInt(minutes, 10);
    
    if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
    if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
    
    const sessionTime = parseSessionDateTime(dateStr, timeStr);
    
    return sessionTime > new Date();
  } catch (err) {
    return true; // default to keeping it if parsing fails
  }
};
