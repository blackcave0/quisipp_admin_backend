/**
 * Utility functions for handling API retries and rate limiting
 */

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - The async function to retry
 * @param {number} maxRetries - Maximum number of retry attempts (default: 3)
 * @param {number} baseDelay - Base delay in milliseconds (default: 1000)
 * @param {Array} retryableStatusCodes - HTTP status codes that should trigger a retry (default: [429, 502, 503, 504])
 * @returns {Promise} - The result of the function call
 */
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000, retryableStatusCodes = [429, 502, 503, 504]) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      // Check if the error status code is retryable and we have retries left
      const statusCode = error.response?.status;
      const isRetryable = retryableStatusCodes.includes(statusCode);
      
      if (isRetryable && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
        const jitter = Math.random() * 0.1 * delay; // Add jitter to prevent thundering herd
        const totalDelay = delay + jitter;
        
        console.log(
          `Request failed with status ${statusCode}. Retrying in ${Math.round(totalDelay)}ms... (Attempt ${attempt}/${maxRetries})`
        );
        
        await new Promise((resolve) => setTimeout(resolve, totalDelay));
        continue;
      }
      
      // If it's not a retryable error or we've exhausted retries, throw the error
      throw error;
    }
  }
};

/**
 * Create a rate-limited axios instance with retry logic
 * @param {Object} axiosInstance - The axios instance to wrap
 * @param {Object} options - Configuration options
 * @returns {Object} - Wrapped axios instance with retry logic
 */
const createRetryableAxios = (axiosInstance, options = {}) => {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    retryableStatusCodes = [429, 502, 503, 504]
  } = options;

  // Create a wrapper for common HTTP methods
  const wrapMethod = (method) => {
    return async (...args) => {
      return retryWithBackoff(
        () => axiosInstance[method](...args),
        maxRetries,
        baseDelay,
        retryableStatusCodes
      );
    };
  };

  return {
    get: wrapMethod('get'),
    post: wrapMethod('post'),
    put: wrapMethod('put'),
    delete: wrapMethod('delete'),
    patch: wrapMethod('patch'),
    // Add the original instance for any other methods
    original: axiosInstance
  };
};

/**
 * Handle API errors consistently
 * @param {Object} error - The error object
 * @param {Object} res - Express response object
 * @param {string} defaultMessage - Default error message
 */
const handleApiError = (error, res, defaultMessage = "Internal server error") => {
  console.log("API Error:", error.message);
  
  if (error.response?.status === 429) {
    return res.status(429).json({
      success: false,
      message: "External service is rate limited. Please try again later.",
    });
  }
  
  if (error.response?.status) {
    // Forward the status code from the external API
    return res.status(error.response.status).json({
      success: false,
      message: error.response.data?.message || "External service error",
    });
  }
  
  return res.status(500).json({
    success: false,
    message: defaultMessage,
  });
};

module.exports = {
  retryWithBackoff,
  createRetryableAxios,
  handleApiError
};
