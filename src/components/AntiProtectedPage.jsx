import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/AuthProvider';
import Loading from './loading/Loading';

const AntiProtectedRoute = ({ children }) => {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return Loading();
  }

  return !isLoggedIn ? children : <Navigate to="/" replace />;
};

export default AntiProtectedRoute;