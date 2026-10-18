import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Todas las llamadas a la API llevan el token de la sesión (antes no lo enviaban y la API respondía sin sesión).
// Si la sesión venció (401), se cierra y se vuelve al login.
const API_HOST = 'https://api.facturador.lidutech.net';
const nativeFetch = window.fetch.bind(window);
window.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  const token = localStorage.getItem('authToken');
  const isApi = url.startsWith(API_HOST);
  if (isApi && token && !url.endsWith('/auth/login')) {
    const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
    headers.set('Authorization', `Bearer ${token}`);
    init = { ...init, headers };
  }
  const res = await nativeFetch(input, init);
  if (isApi && res.status === 401 && !url.endsWith('/auth/login')) {
    localStorage.removeItem('authToken');
    window.location.assign('/');
  }
  return res;
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
