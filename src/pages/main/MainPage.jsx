import { Navigate } from "react-router-dom";
import Loading from "../../components/loading/Loading";
import { useAuth } from "../../hooks/AuthProvider";

export default function MainPage() {
    const { user, loading } = useAuth();

    if (loading) {
        return Loading();
    }

    return user && user.role === 'tutor' ? <Navigate to="/tutor-dashboard" replace /> : <Navigate to='/student-dashboard' replace/>;
}