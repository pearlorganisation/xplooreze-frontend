import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/AuthProvider';
import Loading from './loading/Loading';

const ProtectedRoute = ({ children }) => {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return Loading();
  }


  return isLoggedIn ? children : <Navigate to="/welcome" replace />;
};

export default ProtectedRoute;