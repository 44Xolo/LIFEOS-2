import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

(window as unknown as { gm_authFailure?: () => void }).gm_authFailure = () => {
  window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
};

const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  originalConsoleError.apply(console, args);
  const message = args.map((item) => String(item)).join(' ');
  if (message.includes('OverQuotaMapError') || message.includes('QuotaExceededError')) {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  }
};

createRoot(document.getElementById('root')!).render(<App />);
