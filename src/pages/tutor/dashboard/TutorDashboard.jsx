import { useEffect, useRef, useState } from 'react';
import './TutorDashboard.css';
import { FaUsers, FaExchangeAlt, FaCoins, FaEye } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/AuthProvider';
import TutorSidebar from '../../../components/tutor-sidebar/TutorSidebar';
// --- Added API imports ---
import { getBookings, getDashboardInsights } from '../../../data/modules/tutor-module';

export function TutorDashboard() {
  const [isUnderReview, setIsUnderReview] = useState(true);
  const [showCityWarning, setShowCityWarning] = useState(false);
  const { user } = useAuth();
  const [showSidebar, setShowSidebar] = useState(false);

  const navigate = useNavigate();
  
  // --- Updated state ---
  const [insights, setInsights] = useState({
    totalViews: 0,
    totalConversions: 0,
    activeStudents: 0,
    totalEarning: 0,
    totalWithdrawals: 0,
  });
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [newRequests, setNewRequests] = useState([]);

  useEffect(() => {
    setIsUnderReview(!(user.verificationStatus === 'verified'));

    try {
      setShowCityWarning(user.role === 'tutor' && !user.city.toLowerCase().includes('bengalore') && !user.tutoring_mode.includes('Online Tutoring'));
    } catch (error) {
      console.error(error);
    }
  }, [user]);

  // --- Added data fetching effect ---
  useEffect(() => {
    // Only fetch data if the tutor is verified
    if (user && user.verificationStatus === 'verified') {
      const fetchData = async () => {
        try {
          // 1. Fetch Insights
          const insightsDataPromise = getDashboardInsights();
          
          // 2. Fetch Bookings (for new requests)
          const newRequestsPromise = getBookings({ statuses: ['pending'] });

          // 3. Fetch Bookings (for upcoming classes)
          // We get 'active' bookings and filter for today client-side
          const activeBookingsPromise = getBookings({ statuses: ['active'] });

          // Wait for all promises to resolve
          const [
            insightsData, 
            newRequestsData, 
            activeBookingsData
          ] = await Promise.all([
            insightsDataPromise,
            newRequestsPromise,
            activeBookingsPromise
          ]);

          // Set insights
          if (insightsData) {
            setInsights(insightsData);
          }
          
          // Set new requests
          if (newRequestsData && newRequestsData.bookings) {
            setNewRequests(newRequestsData.bookings);
          }

          // Set upcoming classes (client-side filter for today)
          if (activeBookingsData && activeBookingsData.bookings) {
            const today = new Date().setHours(0, 0, 0, 0); // Get start of today
            
            const todayClasses = activeBookingsData.bookings.filter(booking => {
              const bookingStartDate = new Date(booking.startDate).setHours(0, 0, 0, 0);
              // Simple check: is the start date today?
              return bookingStartDate === today;
            });
            setUpcomingClasses(todayClasses);
          }

        } catch (err) {
          console.error("Failed to fetch dashboard data:", err);
          // You could set an error state here
        }
      };

      fetchData();
    }
  }, [user]); // Re-run when user object changes

  return (
    <div className="dashboard-container">
      <TutorSidebar showSidebar={showSidebar} setShowSidebar={setShowSidebar} />
      <main className="dashboard-main">
        <div className="topbar">
          <button className="menu-toggle" onClick={() => setShowSidebar(!showSidebar)}>
            &#9776;
          </button>
          <div className="title">Dashboard</div>
          <div className="profile">
            <div className={`avatar ${user.profilePhoto ? 'photo' : ''}`}>
              {user.profilePhoto ? (
                <img src={`${import.meta.env.VITE_APP_BASE_URL}/${user.profilePhoto}`} alt="Profile" className="avatar-img" />
              ) : (
                user.fullName
                  ? user.fullName
                    .split(' ')
                    .map(name => name[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()
                  : '??'
              )}
            </div>
            <div className="welcome-text">
              Welcome back, {user.fullName ? user.fullName.split(' ')[0] : 'Unknown'}
            </div>
          </div>
        </div>

        {/* --- Stats grid now uses state --- */}
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Views</h3>
            <div className="stat-text">
              <div className="icon-box">
                <FaEye />
              </div>
              <p className="stat-value">{insights.totalViews}</p>
            </div>
          </div>
          <div className="stat-card">
            <h3>Total Conversion</h3>
            <div className="stat-text">
              <div className="icon-box">
                <FaExchangeAlt />
              </div>
              <p className="stat-value">{insights.totalConversions}</p>
            </div>
          </div>
          <div className="stat-card">
            <h3>Active Students</h3>
            <div className="stat-text">
              <div className="icon-box">
                <FaUsers />
              </div>
              <p className="stat-value">{insights.activeStudents}</p>
            </div>
          </div>
          <div className="stat-card">
            <h3>Total Earning</h3>
            <div className="stat-text">
              <div className="icon-box">
                <FaCoins />
              </div>
              <p className="stat-value">{insights.totalEarning} rs</p>
            </div>
          </div>
          <div className="stat-card">
            <h3>Total Withdrawals</h3>
            <div className="stat-text">
              <div className="icon-box">
                <FaCoins />
              </div>
              <p className="stat-value">{insights.totalWithdrawals} rs</p>
            </div>
          </div>
        </div>

        {showCityWarning && <div className="review-card">
          <h2>Home tutoring services are currently available exclusively in Bengaluru.</h2>
          <p>You may also select the online tutoring option in your <a href="/tutor-account" style={{
            textDecoration: 'none',
            color: 'var(--primary-color)'
          }}>account</a> to connect with students from anywhere.</p>
        </div>}
        {isUnderReview ? (
          <div className="review-card">
            <h2>{user.verificationStatus === 'rejected' ? 'Your Profile Has Been Rejected.' : 'Your account is under review'}</h2>
            <p>{user.verificationStatus === 'rejected' ? user.rejectionReason || 'Resubmit your details to request again.' : 'We’re currently reviewing your account details. Once approved, you’ll have full access to your dashboard features.'}</p>
            { user.verificationStatus === 'rejected' && <button className='primary-btn' onClick={() => navigate('/verify-tutor')}>Resubmit Your Documents</button> }
          </div>
        ) : (
          <div className="tables-grid">
            <div className="table-section">
              <div className='header'>
                <h3>Today's Classes</h3>
                {/* --- This link now goes to /tutor-bookings --- */}
                <Link to='/tutor-requests'><p>View All</p></Link>
              </div>
              <table className="data-table">
                {upcomingClasses.length !== 0 && (
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Subject</th>
                      <th>Mode</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                )}
                <tbody>
                  {upcomingClasses.map((cls) => (
                    <tr key={cls._id}>
                      <td>{cls.studentId?.fullName || 'Student'}</td>
                      <td>{cls.subject}</td>
                      <td>{cls.tutoringMode.join(', ')}</td>
                      <td>{cls.startTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {upcomingClasses.length === 0 && (
                <div className='empty-state'>
                  <p>No classes scheduled for today.</p>
                </div>
              )}
            </div>

            <div className="table-section requests">
              <div className='header'>
                <h3>New Requests</h3>
                <Link to='/tutor-requests'><p>View All</p></Link>
              </div>
              <table className="data-table">
                {newRequests.length !== 0 && (
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Subject</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                )}
                <tbody>
                  {newRequests.map((req) => (
                    <tr key={req._id}>
                      <td>{req.studentId?.fullName || 'Student'}</td>
                      <td>{req.subject}</td>
                      <td><Link to='/tutor-requests'><FaEye /></Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {newRequests.length === 0 && (
                <div className='empty-state'>
                  <p>You're all caught up.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}