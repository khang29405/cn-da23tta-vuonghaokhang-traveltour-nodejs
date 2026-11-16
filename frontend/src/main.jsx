import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
// CSS toàn cục phải nạp trước, để CSS riêng của từng trang/component được ghi đè lên
import './styles/global.css';
import { AuthProvider } from './context/AuthProvider.jsx';
import AppRouter from './routes/AppRouter.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
