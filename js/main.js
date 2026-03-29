// ============================================================
// MAIN.JS — Entry point, khởi động ứng dụng
// ============================================================
import { loadState } from './state.js';
import { renderApp } from './renderer.js';
import { registerEventListeners, startOverdueChecker } from './events.js';

// Khởi chạy ứng dụng
loadState();
registerEventListeners();
startOverdueChecker();
renderApp();
