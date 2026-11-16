const STORAGE_KEY = 'traveltour_auth';

const readAuth = () => {
  try {
    const auth = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return auth?.token && auth?.user ? auth : null;
  } catch {
    return null;
  }
};

export const getToken = () => readAuth()?.token ?? null;

export const getStoredUser = () => readAuth()?.user ?? null;

export const saveAuth = (token, user) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
};

export const clearAuth = () => {
  localStorage.removeItem(STORAGE_KEY);
};
