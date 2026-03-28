// API Configuration
// In development, use relative paths (Vite proxy handles routing)
// In production, use the full URL from environment variable
const API_BASE_URL = 
  import.meta.env.MODE === 'development' 
    ? '' // Use relative path with Vite proxy in dev
    : (import.meta.env.VITE_API_URL || 'http://localhost:5000');

// Helper function to make API calls with authentication
async function apiCall(endpoint, method = 'GET', data = null) {
  const token = localStorage.getItem('authToken');
  
const headers = {
    'Content-Type': 'application/json',
  };


  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(data);
  }

  try {
    const url = API_BASE_URL + endpoint;
    console.log(`[API ${method}] ${url}`, data && { data });
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP Error: ${response.status}`);
    }

    const result = await response.json();
    console.log(`[API Response]`, result);
    return result; 
  } catch (error) {
    console.error(`[API Error - ${endpoint}]:`, error);   
    throw error;
  }
}

// User APIs
export const userAPI = {
  register: (name, email, password) =>
    apiCall('/api/user/register', 'POST', { name, email, password }),
  
  verifyOtp: (email, otp) =>
    apiCall('/api/user/verify-otp', 'POST', { email, otp }),

  resendOtp: (email) =>
    apiCall('/api/user/resend-otp', 'POST', { email }),

  login: (email, password) =>
    apiCall('/api/user/login', 'POST', { email, password }),
  
  getUser: () =>
    apiCall('/api/user/get', 'GET'),
};

// Chat APIs
export const chatAPI = {
  createChat: () =>
    apiCall('/api/chat/create', 'POST'),
  
  getChats: () =>
    apiCall('/api/chat/', 'GET'),
  
  deleteChat: (chatId) =>
    apiCall(`/api/chat/delete/${chatId}`, 'DELETE'),
};

// Message APIs
export const messageAPI = {
  sendTextMessage: (chatId, content) =>
    apiCall('/api/messages/text', 'POST', { chatId, content }),
  
  sendImageMessage: (chatId, prompt, isPublished = false) =>
    apiCall('/api/messages/image', 'POST', { chatId, prompt, isPublished }),

  getPublishedImages: () =>
    apiCall('/api/messages/published', 'GET'),
};

export default {
  userAPI,
  chatAPI,
  messageAPI,
};
