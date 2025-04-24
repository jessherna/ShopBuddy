/**
 * Application configuration
 */

// Backend URL - replace with your actual backend URL when deploying
// For local development, use your machine's IP address so mobile devices can connect
export const BACKEND_URL = 'http://192.168.1.16:3000'; 

// Socket.IO options
export const SOCKET_OPTIONS = {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
};

// Default settings
export const DEFAULT_SETTINGS = {
  theme: 'light',
  saveHistory: true,
  notifications: true,
};

// Testing flag
export const IS_TESTING = false;

// Export all configs
export default {
  BACKEND_URL,
  SOCKET_OPTIONS,
  DEFAULT_SETTINGS,
  IS_TESTING,
}; 