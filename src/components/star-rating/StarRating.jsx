import React, { useState } from 'react';
import { FaStar, FaRegStar } from 'react-icons/fa';
import './StarRating.css';

export default function StarRating({ rating = 0, editable = false, onChange }) {
    const [hoverRating, setHoverRating] = useState(0);

    const handleClick = (selectedRating) => {
        if (editable && onChange) {
            onChange(selectedRating);
        }
    };

    const handleMouseEnter = (star) => {
        if (editable) {
            setHoverRating(star);
        }
    };

    const handleMouseLeave = () => {
        if (editable) {
            setHoverRating(0);
        }
    };

    const displayRating = hoverRating || rating;

    return (
        <div className={`star-rating ${editable ? 'editable' : 'read-only'}`}>
            {[1, 2, 3, 4, 5].map((star) => (
                <span
                    key={star}
                    className="star"
                    onClick={() => handleClick(star)}
                    onMouseEnter={() => handleMouseEnter(star)}
                    onMouseLeave={handleMouseLeave}
                >
                    {star <= displayRating ? (
                        <FaStar className="star-filled" />
                    ) : (
                        <FaRegStar className="star-empty" />
                    )}
                </span>
            ))}
        </div>
    );
}
