import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./TutorCard.css";
import {
  FaClock,
  FaGlobe,
  FaBook,
  FaHourglass,
  FaCertificate,
  FaHeart,
} from "react-icons/fa";
import { addFavorite, removeFavorite } from "../../data/modules/student-module";
import StarRating from "../star-rating/StarRating";

export default function TutorCard({ tutor, canTrial }) {
  const navigate = useNavigate();

  // 1. Check Authentication Status
  // Replace 'token' with whatever key you use to store your auth session/token
  const isAuthenticated = !!localStorage.getItem("token");

  const [isFavorited, setIsFavorited] = useState(tutor.isFavourite || false);

  useEffect(() => {
    setIsFavorited(tutor.isFavourite || false);
  }, [tutor.isFavourite, tutor._id]);

  const profilePhoto =
    tutor.profilePhoto && !tutor.profilePhoto.startsWith("http")
      ? `${import.meta.env.VITE_APP_BASE_URL}/${tutor.profilePhoto}`
      : tutor.profilePhoto || "/app-logo-black.png";

  // 2. Modified Navigation Handler with Login Wall
  const handleProtectedNavigation = (e, targetPath) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      // If not logged in, redirect to the registration/login page provided in your sample
      // You can also append a "redirect" query param if you want to return here after login
      navigate(
        "/authentication?authType=registration&userRole=student&tutoringMode=Online%20Tutoring",
      );
    } else {
      // If logged in, proceed to details
      navigate(targetPath);
    }
  };

  const handleFavoriteToggle = async (e) => {
    e.stopPropagation();

    // Optional: Add login wall to favorites too
    if (!isAuthenticated) {
      navigate("/authentication?authType=registration&userRole=student");
      return;
    }

    const previousState = isFavorited;
    setIsFavorited(!previousState);

    try {
      if (previousState) {
        await removeFavorite({ tutorId: tutor._id });
      } else {
        await addFavorite({ tutorId: tutor._id });
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      setIsFavorited(previousState);
    }
  };

  return (
    <div
      className="tutor-card-root"
      // Apply protected navigation to the whole card
      onClick={(e) =>
        handleProtectedNavigation(e, `/tutor-details/${tutor._id}`)
      }
    >
      <div className="first-section">
        <img
          src={profilePhoto}
          alt={tutor.fullName}
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = import.meta.env.VITE_PROFILE_PHOTO_PLACEHOLDER;
            // import.meta.env.VITE_PROFILE_PHOTO_PLACEHOLDER || "/fallback.png";
          }}
        />
        <FaHeart
          className={`favourite-button ${isFavorited ? "selected" : ""}`}
          onClick={handleFavoriteToggle}
        />
      </div>

      <div className="second-section">
        <div className="section-header">
          <h1>{tutor.fullName || "Unknown"}</h1>
          <div className="modes">
            {tutor.tutoring_mode?.map((mode) => (
              <p key={mode}>{mode}</p>
            ))}
          </div>
        </div>

        <div className="info-tile">
          <FaBook /> {tutor.subcategory?.join(", ") || "General"}
        </div>
        <div className="info-tile">
          <FaGlobe /> {tutor.languages?.join(", ") || "English"}
        </div>

        <p className="tutor-headline-text">
          {tutor.headline || "Not specified"}
        </p>

        {tutor.totalRatings > 0 && (
          <div className="rating-display">
            <StarRating rating={tutor.averageRating || 0} editable={false} />
            <span className="rating-count">
              ({tutor.totalRatings}{" "}
              {tutor.totalRatings === 1 ? "rating" : "ratings"})
            </span>
          </div>
        )}
      </div>

      <div className="third-section">
        <div className="section-header">
          <h1>
            {tutor.min_hour_charge || "0"} - {tutor.max_hour_charge || "0"}{" "}
            {tutor.currency || "USD"}
          </h1>
          <p className="price-subtitle">Per Hour</p>
        </div>

        <div className="third-info">
          <div className="info-tile">
            <FaHourglass />
            <span>{tutor.class_duration || "60 min"}</span>
          </div>
          <div className="info-tile">
            <FaClock />
            <span>
              {tutor.teaching_experience
                ? `${tutor.teaching_experience} Years`
                : "Fresher"}
            </span>
          </div>
          <div className="info-tile">
            <FaCertificate />
            <span>{tutor.teaching_level || "All Levels"}</span>
          </div>
        </div>

        <div className="button-group">
          <button
            className="primary-btn"
            // Apply protected navigation to button
            onClick={(e) =>
              handleProtectedNavigation(e, `/tutor-details/${tutor._id}`)
            }
          >
            Book A Class Now →
          </button>

          {canTrial && (
            <button
              className="secondary-btn"
              // Apply protected navigation to trial button
              onClick={(e) =>
                handleProtectedNavigation(
                  e,
                  `/tutor-details/${tutor._id}?trial=true`,
                )
              }
            >
              Book A Free Trial
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
