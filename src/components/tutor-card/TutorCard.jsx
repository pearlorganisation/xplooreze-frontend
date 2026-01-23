import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import './TutorCard.css';
import { FaClock, FaGlobe, FaBook, FaHourglass, FaCertificate, FaHeart } from 'react-icons/fa';
import { addFavorite, removeFavorite } from '../../data/modules/student-module';
import StarRating from '../star-rating/StarRating';

// --- 1. Receive the 'canTrial' prop ---
export default function TutorCard({ tutor, canTrial }) {
    const navigate = useNavigate();
    const [isFavorited, setIsFavorited] = useState(tutor.isFavourite || false);

    const profilePhoto = tutor.profilePhoto && !tutor.profilePhoto.startsWith('http')
        ? `${import.meta.env.VITE_APP_BASE_URL}/${tutor.profilePhoto}`
        : tutor.profilePhoto || '/app-logo-black.png';

    const handleFavoriteToggle = async (e) => {
        e.stopPropagation(); // Stop click from bubbling to the card
        try {
            if (isFavorited) {
                await removeFavorite({ tutorId: tutor._id });
            } else {
                await addFavorite({ tutorId: tutor._id });
            }
            setIsFavorited(!isFavorited);
        } catch (error) {
            console.error('Failed to toggle favorite:', error);
            // Optionally, show a toast notification here
        }
    };

    // --- MODIFIED: Created separate click handlers for navigation ---
    const handleNavigation = (e, path) => {
        e.stopPropagation(); // Stop click from bubbling to the card
        navigate(path);
    };

    return (
        <div
            className="tutor-card-root"
            // Card click navigates without query param
            onClick={() => navigate(`/tutor-details/${tutor._id}`)}
        >
            <div className='first-section'>
                <img
                    src={profilePhoto}
                    onError={(e) => { e.target.onerror = null; e.target.src = import.meta.env.VITE_PROFILE_PHOTO_PLACEHOLDER; }}
                />
                <FaHeart
                    className={`favourite-button ${isFavorited ? 'selected' : ''}`}
                    onClick={handleFavoriteToggle}
                />
            </div>
            <div className='second-section'>
                <div className='section-header'>
                    <h1>{tutor.fullName || 'Unknown'}</h1>
                    <div className='modes'>
                        {tutor.tutoring_mode.map(mode => (<p key={mode}>{mode}</p>))}
                    </div>
                </div>

                <div className='info-tile'><FaBook /> {tutor.subcategory.join(', ')}</div>
                <div className='info-tile'><FaGlobe /> {tutor.languages.join(', ') || 'None'}</div>
                <p
                    style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'normal'
                    }}
                >
                    {tutor.headline || 'Not specified'}
                </p>

                {/* Rating Display */}
                {tutor.totalRatings > 0 && (
                    <div className='rating-display'>
                        <StarRating rating={tutor.averageRating || 0} editable={false} />
                        <span className='rating-count'>({tutor.totalRatings} {tutor.totalRatings === 1 ? 'rating' : 'ratings'})</span>
                    </div>
                )}
            </div>
            <div className='third-section'>
                <div className='section-header'>
                    <h1>{tutor.min_hour_charge || 'N/A'} - {tutor.max_hour_charge || 'N/A'} {tutor.currency}</h1>
                    <p className='price-subtitle'>Per Hour</p>
                    {/* <p className='price-subtitle'>{tutor.matchingPercentage}%</p> */}
                </div>
                <div className='third-info'>
                    <div className='info-tile'>
                        <FaHourglass />
                        <span>{tutor.class_duration || 'None'}</span>
                    </div>
                    <div className='info-tile'>
                        <FaClock />
                        <span>{tutor.teaching_experience ? `${tutor.teaching_experience || 'None'} Years` : 'Fresher'}</span>
                    </div>
                    <div className='info-tile'>
                        <FaCertificate />
                        <span>{tutor.teaching_level || 'None'}</span>
                    </div>
                </div>
                <div className='button-group'>
                    <button
                        className='primary-btn'
                        // Button click also navigates (with stopPropagation)
                        onClick={(e) => handleNavigation(e, `/tutor-details/${tutor._id}`)}
                    >
                        Book A Class Now →
                    </button>

                    {/* --- 2. Conditionally render the trial button --- */}
                    {canTrial && (
                        <button
                            className='secondary-btn'
                            // Trial button click navigates with query param (and stopPropagation)
                            onClick={(e) => handleNavigation(e, `/tutor-details/${tutor._id}?trial=true`)}
                        >
                            Book A Free Trial
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}