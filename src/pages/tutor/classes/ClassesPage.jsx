import './ClassesPage.css';
import TutorSidebar from '../../../components/tutor-sidebar/TutorSidebar';
import { useEffect, useState } from 'react';
import { getBookings } from '../../../data/modules/tutor-module';
import BookingCard from '../../../components/booking-card/BookingCard';

const requestStatuses = ['active', 'completed', 'expired'];

export function ClassesPage() {
    const [showSidebar, setShowSidebar] = useState(false);
    const [filter, setFilter] = useState('active'); // 'all', 'pending', 'accepted', 'rejected', 'expired'
    const [filteredBookings, setFilteredBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    async function fetchBookings() {
        try {
            setLoading(true);
            const data = await getBookings({ statuses: [filter] });
            const fetchedBookings = data.bookings || [];
            setFilteredBookings(fetchedBookings);
        } catch (err) {
            setError(err);
            console.log('Error fetching bookings', err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchBookings();
    }, [filter]);

    const handleFilterChange = (newFilter) => {
        setFilter(newFilter);
    };

    const isPhone = window.innerWidth <= 768;

    return (
        <div className="classes-container">
            <TutorSidebar showSidebar={showSidebar} setShowSidebar={setShowSidebar} />
            {loading && <div className={`loading-container${isPhone ? ' phone' : ''}`}>
                <div className="spinner" />
            </div>}
            {error && <div style={{
                margin: '0 auto',
                padding: '20px',
                minHeight: 'calc(100vh - 70px)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <p style={{ color: 'red', textAlign: 'center' }}>Error loading bookings: {error}</p>
            </div>}
            {!loading && !error && <main className="classes-main">
                <div className="topbar">
                    <button className="menu-toggle" onClick={() => setShowSidebar(!showSidebar)}>
                        &#9776;
                    </button>
                    <div className="title">Active Classes</div>
                </div>
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 'var(--space-2)'
                }}>
                    {[...requestStatuses].map(status => (
                        <button
                            key={status}
                            style={{
                                padding: '8px 16px',
                                border: '1px solid var(--primary-color)',
                                backgroundColor: filter === status ? 'var(--primary-color)' : 'transparent',
                                color: filter === status ? 'white' : 'var(--primary-color)',
                                borderRadius: '20px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                marginBottom: '18px'
                            }}
                            onClick={() => handleFilterChange(status)}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>
                {!loading && !error && filteredBookings.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '40px',
                        color: '#6b7280',
                        height: 'calc(100vh - 250px)',
                        display: 'flex',
                        alignContent: 'center',
                        alignItems: 'center',
                        justifyContent: 'center',
                        justifyItems: 'center'
                    }}>
                        <p>No Active Classes At This Time</p>
                    </div>
                ) : (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '20px'
                    }}>
                        {filteredBookings.map(booking => (
                            <BookingCard key={booking._id} booking={booking} isTutor={true} />
                        ))}
                    </div>
                )}
            </main>}
        </div>
    );
}