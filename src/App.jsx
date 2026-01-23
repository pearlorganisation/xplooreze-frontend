import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import './App.css';
import Footer from './components/footer/Footer';
import NavBar from './components/navbar/NavBar';
import WelcomePage from './pages/welcome/WelcomePage';
import BlogDetailPage from './pages/blogs/BlogDetailPage';
import ScrollToTop from './components/ScrollToTop';
import BlogPage from './pages/blogs/BlogPage';
import PrivacyPage from './pages/privacy/PrivacyPage';
import AboutUsPage from './pages/about-us/AboutUsPage';
import AuthenticationPage from './pages/authentication/AuthenticationPage';
import { AuthProvider } from './hooks/AuthProvider';
import TermsPage from './pages/terms/TermsPage';
import ProtectedRoute from './components/ProtectedRoute';
import AntiProtectedRoute from './components/AntiProtectedPage';
import MainPage from './pages/main/MainPage';
import { TutorDashboard } from './pages/tutor/dashboard/TutorDashboard';
import StudentDashboard from './pages/student/dashboard/StudentDashboard';
import TutorAccount from './pages/tutor/account/TutorAccount';
import { RequestsPage } from './pages/tutor/requests/RequestsPage';
import { StudentsPage } from './pages/tutor/students/StudentsPage';
import { ClassesPage } from './pages/tutor/classes/ClassesPage';
import { PaymentsPage } from './pages/tutor/payments/PaymentsPage';
import StudentAccount from './pages/student/account/StudentAccount';
import MyClasses from './pages/student/classes/MyClasses';
import StudentNavBar from './components/navbar/StudentNavBar';
import PhdMentorship from './pages/phd-mentorship/PhdMentorship';
import ResearchForm from './pages/phd-mentorship/research-form/researchForm';
import ConsultationForm from './pages/phd-mentorship/consultation-form/consultationForm';
import CancellationRefundPolicy from './pages/policies/CancellationRefundPolicy';
import ShippingPolicy from './pages/policies/ShippingPolicy';
import TutorDetail from './pages/student/tutor-details/TutorDetails';
import FavouriteTutors from './pages/student/favourites/FavouriteTutors';
import VideoCall from './pages/videocall/VideoCall';
import { BankDetailsPage } from './pages/tutor/bank-details/BankDetailsPage';
import { VerificationPage } from './pages/tutor/verification-page/VerificationPage';

function AppContent() {
  const location = useLocation();
  const pageRequiringNavBar = [ '/welcome', '/blogs', '/blog-details', '/privacy-policy', '/terms-and-conditions', '/cancellation-refund', '/shipping-policy' , '/about-us', '/phd-mentorship' ];
  const hideNav = !pageRequiringNavBar.some(el => location.pathname.includes(el));

   const pageRequiringStudentNavBar = [ '/student-dashboard', '/student-classes', '/favourite-tutors','/tutor-details' ];
  const hideStudentNav = !hideNav || !pageRequiringStudentNavBar.find(path => location.pathname.startsWith(path));

  return (
    <div className={location.pathname === '/welcome' ? "app-container" : "container"}>
      {!hideNav && <NavBar />}
      {!hideStudentNav && <StudentNavBar />}
      <ScrollToTop />
      <Routes>
         <Route path="/" element={<ProtectedRoute><MainPage /></ProtectedRoute>} />
         <Route path="/tutor-dashboard" element={<ProtectedRoute><TutorDashboard /></ProtectedRoute>} />
         <Route path="/tutor-requests" element={<ProtectedRoute><RequestsPage /></ProtectedRoute>} />
         <Route path="/tutor-students" element={<ProtectedRoute><StudentsPage /></ProtectedRoute>} />
         <Route path="/tutor-bank-details" element={<ProtectedRoute><BankDetailsPage /></ProtectedRoute>} />
         <Route path="/tutor-payments" element={<ProtectedRoute><PaymentsPage /></ProtectedRoute>} />
         <Route path="/tutor-classes" element={<ProtectedRoute><ClassesPage /></ProtectedRoute>} />
          <Route path="/tutor-account" element={<ProtectedRoute><TutorAccount /></ProtectedRoute>} />
           <Route path="/verify-tutor" element={<ProtectedRoute><VerificationPage /></ProtectedRoute>} />
          <Route path="/video-call/:id" element={<ProtectedRoute><VideoCall /></ProtectedRoute>} />
         <Route path="/student-dashboard" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
         <Route path="/student-classes" element={<ProtectedRoute><MyClasses /></ProtectedRoute>} />
         <Route path="/favourite-tutors" element={<ProtectedRoute><FavouriteTutors /></ProtectedRoute>} />
         <Route path="/tutor-details/:id" element={<ProtectedRoute><TutorDetail /></ProtectedRoute>} />
         <Route path="/student-account" element={<ProtectedRoute><StudentAccount /></ProtectedRoute>} />
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/blogs" element={<BlogPage />} />
        <Route path="/phd-mentorship" element={<PhdMentorship />} />
        <Route path="/research-form" element={<ResearchForm />} />
        <Route path="/consultation-form" element={<ConsultationForm />} />
        <Route path="/blog-details/:blogId" element={<BlogDetailPage />} />
        <Route path="/privacy-policy" element={<PrivacyPage />} />
        <Route path="/cancellation-refund" element={<CancellationRefundPolicy />} />
        <Route path="/shipping-policy" element={<ShippingPolicy />} />
        <Route path="/terms-and-conditions" element={<TermsPage />} />
        <Route path="/about-us" element={<AboutUsPage />} />
        <Route path="/authentication/*" element={<AntiProtectedRoute><AuthenticationPage /></AntiProtectedRoute>} />
      </Routes>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;