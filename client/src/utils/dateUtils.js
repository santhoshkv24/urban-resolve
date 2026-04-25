/**
 * Formats a date string or object into dd-mm-yyyy format.
 * @param {string|Date} dateSource 
 * @returns {string} Formatted date string
 */
export const formatDate = (dateSource) => {
  if (!dateSource) return 'N/A';
  const d = new Date(dateSource);
  if (isNaN(d.getTime())) return 'N/A';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}-${month}-${year}`;
};

/**
 * Formats a date string or object into dd-mm-yyyy HH:MM:SS format.
 * @param {string|Date} dateSource 
 * @returns {string} Formatted date-time string
 */
export const formatDateTime = (dateSource) => {
  if (!dateSource) return 'N/A';
  const d = new Date(dateSource);
  if (isNaN(d.getTime())) return 'N/A';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
};
