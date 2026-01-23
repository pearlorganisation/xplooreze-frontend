import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaClock, FaTimes } from 'react-icons/fa';
import './ClassReminderBanner.css';

export default function ClassReminderBanner({ classInfo, onClose }) {
    const [bannerMessage, setBannerMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const updateMessage = () => {
            const now = new Date();
            const classStart = new Date(classInfo.startDateTime);

            if (now >= classStart) {
                setBannerMessage('has started');
            } else {
                setBannerMessage('is about to start');
            }
        };

        // Update immediately
        updateMessage();

        // Update every 10 seconds to check if class has started
        const interval = setInterval(updateMessage, 10000);

        return () => clearInterval(interval);
    }, [classInfo.startDateTime]);

    const handleGoToClasses = () => {
        navigate('/student-classes');
    };

    return (
        <div className="class-reminder-banner">
            <div className="banner-content">
                <div className="banner-icon">
                    <FaClock />
                </div>
                <div className="banner-text">
                    <h3 className="banner-subject">{classInfo.subject}</h3>
                    <p className="banner-time">
                        Class <strong>{bannerMessage}</strong>
                    </p>
                </div>
            </div>
            <div className="banner-actions">
                <button className="banner-go-btn" onClick={handleGoToClasses}>
                    Go to Classes
                </button>
                <button className="banner-close" onClick={onClose} aria-label="Close reminder">
                    <FaTimes />
                </button>
            </div>
        </div>
    );
}
