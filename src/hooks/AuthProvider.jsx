import { createContext, useContext, useState, useEffect } from 'react';
import { getProfile } from '../data/modules/users-data-module';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // <--- new

  useEffect(() => {
    async function fetchFreshUser() {
      try {
        const user = await getProfile();
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
          setUser(user);
        }
      } catch (error) {
        console.error('Error while getting user:', error);
      }
    }

    const token = localStorage.getItem('token');
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    setUser(storedUser);
    const isLoggedIn = !!token &&
      storedUser &&
      (storedUser.role === 'student' || (storedUser.role === 'tutor' && storedUser.isFormSubmitted));
      if (isLoggedIn) {
        fetchFreshUser();
      }
    setIsLoggedIn(isLoggedIn);

    setLoading(false); // <--- done loading
  }, []);

  const login = (token, userData) => {
    if (token) localStorage.setItem('token', token);
    if (userData) localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsLoggedIn(
      !!token &&
      userData &&
      (userData.role === 'student' || (userData.role === 'tutor' &&userData.isFormSubmitted))
    );
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout, loading, setIsLoggedIn, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);