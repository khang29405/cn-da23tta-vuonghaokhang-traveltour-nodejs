import { createContext, useContext } from 'react';

// Tách khỏi AuthProvider.jsx để file component chỉ xuất component (Fast Refresh của Vite yêu cầu)
export const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);
