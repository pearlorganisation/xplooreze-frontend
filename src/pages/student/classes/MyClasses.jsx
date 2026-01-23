import { useState, useEffect } from 'react';
import BookingCard from '../../../components/booking-card/BookingCard';
import { getBookings } from '../../../data/modules/student-module'; // Adjust path as needed
import Loading from '../../../components/loading/Loading';

export default function MyClasses() {
    const [filteredBookings, setFilteredBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all'); // 'all', 'pending', 'accepted', 'rejected', 'expired'

    async function fetchBookings() {
        try {
            setLoading(true);
            const data = await getBookings({ status: filter });
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

    if (loading) {
        return <Loading />;
    }

    if (error) {
        return (
            <div style={{
                width: '100%',
                maxWidth: '1200px',
                margin: '0 auto',
                padding: '20px',
                minHeight: 'calc(100vh - 70px)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <p style={{ color: 'red', textAlign: 'center' }}>Error loading bookings: {error}</p>
            </div>
        );
    }

    return (
        <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '20px',
            minHeight: 'calc(100vh - 70px)'
        }}>
            {/* Filter Buttons */}
            <div style={{
                display: 'flex',
                justifyContent: 'flex-start',
                gap: '10px',
                marginBottom: '20px',
                flexWrap: 'wrap'
            }}>
                {['all', 'active', 'pending', 'completed', 'accepted', 'rejected', 'expired'].map(status => (
                    <button
                        key={status}
                        style={{
                            padding: '8px 16px',
                            border: '1px solid var(--primary-color)',
                            backgroundColor: filter === status ? 'var(--primary-color)' : 'transparent',
                            color: filter === status ? 'white' : 'var(--primary-color)',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                        onClick={() => handleFilterChange(status)}
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                ))}
            </div>

            {filteredBookings.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#6b7280'
                }}>
                    <p>No bookings match the selected filter. Start exploring tutors and book your first class!</p>
                </div>
            ) : (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px'
                }}>
                    {filteredBookings.map(booking => (
                        <BookingCard key={booking._id} booking={booking} isTutor={false} />
                    ))}
                </div>
            )}
        </div>
    );
}