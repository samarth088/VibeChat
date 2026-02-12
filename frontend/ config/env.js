// frontend/config/env.js

const API_BASE = "https://vibechat-992r.onrender.com/api";
const SOCKET_URL = "https://vibechat-992r.onrender.com";

export const ENV = {
  API_BASE,
  SOCKET_URL,
  FEATURES: {
    ENABLE_GROUPS: true,
    ENABLE_CALLS: false,
    ENABLE_OCEAN_THEME: true
  }
};
