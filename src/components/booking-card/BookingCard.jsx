// BookingCard.jsx
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "./BookingCard.css"; // Single, merged CSS file
import {
  FaVideo,
  FaMapMarkerAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaInfoCircle,
  FaClock,
} from "react-icons/fa";
import ConfirmDialog from "../dialog/ConfirmDialog";
import StarRating from "../star-rating/StarRating";
// --- MODULE IMPORTS (FROM BOTH) ---
// Tutor-specific
import { acceptBooking, rejectBooking } from "../../data/modules/tutor-module";
// Student-specific
import {
  createBookingOrder,
  verifyBookingPayment,
  submitRating,
} from "../../data/modules/student-module";
import { handlePayment } from "../../data/razorpay";
/* -------------------------------------------------------------------------- */
/* Timezone Helper Functions (Fixed Offset Sign) */
/* -------------------------------------------------------------------------- */
function parseTimeToComponents(timeStr) {
  if (typeof timeStr !== "string" || !timeStr.trim()) return null;
  const input = timeStr.trim();
  const regex = /^(\d{1,2}):(\d{2})$/;
  const match = input.match(regex);
  if (!match) {
    console.warn(`[parseTimeToComponents] Invalid time format: "${input}"`);
    return null;
  }
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const second = 0;
  if (minute < 0 || minute > 59 || hour < 0 || hour > 23) return null;
  return { hour, minute, second };
}
function getLocalDateStr(date, timeZone) {
  if (!date || !timeZone) return new Date(date).toISOString().split("T")[0];
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(date));
  } catch (e) {
    console.warn(
      `[getLocalDateStr] Invalid timezone "${timeZone}". Falling back.`,
    );
    return new Date(date).toISOString().split("T")[0];
  }
}
function getTimezoneOffsetMs(timeZone) {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);
  try {
    const year = parts.find((p) => p.type === "year").value;
    const month = parts.find((p) => p.type === "month").value;
    const day = parts.find((p) => p.type === "day").value;
    const hour = parts.find((p) => p.type === "hour").value;
    const minute = parts.find((p) => p.type === "minute").value;
    const second = parts.find((p) => p.type === "second").value;
    const localDateStr = `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
    const localDate = new Date(localDateStr);
    return now.getTime() - localDate.getTime();
  } catch (e) {
    console.warn(
      `[getTimezoneOffsetMs] Failed to compute offset for ${timeZone}: ${e.message}`,
    );
    return 0;
  }
}
function constructLocalDateTime(dateStr, timeStr, timeZone) {
  if (!dateStr || !timeStr || !timeZone) return null;
  const timeParts = parseTimeToComponents(timeStr);
  if (!timeParts) return null;
  const offsetMs = getTimezoneOffsetMs(timeZone);
  if (offsetMs === undefined || offsetMs === null) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  if (!year || !month || !day) return null;
  const hour = timeParts.hour;
  const minute = timeParts.minute;
  const second = timeParts.second;
  const naiveDate = new Date(
    Date.UTC(year, month - 1, day, hour, minute, second),
  );
  // Fixed: Use + offsetMs (offsetMs is negative for positive timezones like IST)
  const utcTimestamp = naiveDate.getTime() + offsetMs;
  return new Date(utcTimestamp);
}
/* -------------------------------------------------------------------------- */
/* Calculation Helper Functions (Updated: Student Pays Gross Only) */
/* -------------------------------------------------------------------------- */
// Helper to parse time into minutes (supports 12h and 24h)
function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 0;
  // 24-hour format
  const match24 = timeStr.match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/);
  if (match24) {
    const [, h, m] = match24;
    return parseInt(h, 10) * 60 + parseInt(m, 10);
  }
  // 12-hour format
  const match12 = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match12) {
    let [, h, m, period] = match12;
    let hours = parseInt(h, 10);
    if (period.toUpperCase() === "PM" && hours !== 12) hours += 12;
    if (period.toUpperCase() === "AM" && hours === 12) hours = 0;
    return hours * 60 + parseInt(m, 10);
  }
  // Fallback/error
  console.warn(`[parseTimeToMinutes] Invalid time format: ${timeStr}`);
  return 0;
}
// Helper to calculate total number of sessions
function calculateSessionCount(booking) {
  if (booking.sessionType === "single" || !booking.endDate) {
    return 1;
  }
  try {
    const { startDate, endDate, availableDays = [] } = booking;
    if (!startDate || !endDate || availableDays.length === 0) {
      return 1; // Fallback for incomplete 'multiple' booking data
    }
    const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const selectedDays = new Set(availableDays.map((d) => dayMap[d]));
    let count = 0;

    // Use UTC dates to avoid timezone issues in the loop
    const currentDate = new Date(startDate + "T00:00:00Z");
    const lastDate = new Date(endDate + "T00:00:00Z");
    while (currentDate <= lastDate) {
      if (selectedDays.has(currentDate.getUTCDay())) {
        count++;
      }
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
    return count > 0 ? count : 1; // Ensure it's at least 1
  } catch (e) {
    console.error("Error calculating session count:", e);
    return 1; // Fallback
  }
}
// Helper to calculate all amounts (Fixed: Student pays gross; platform covers GST on commission)
function calculateTotals(booking, isTutor) {
  const COMMISSION_RATE = 0.05; // 5%
  const GST_RATE_ON_COMMISSION = 0.18; // 18%
  // Handle Trial Booking
  if (booking.isTrial) {
    return { displayAmount: 0, totalSessions: 1, breakdown: null };
  }
  try {
    const startMinutes = parseTimeToMinutes(booking.startTime);
    const endMinutes = parseTimeToMinutes(booking.endTime);
    const durationHours = (endMinutes - startMinutes) / 60;
    if (durationHours <= 0) {
      return { displayAmount: 0, totalSessions: 0, breakdown: null };
    }
    const totalSessions = calculateSessionCount(booking);
    const grossAmount = booking.price * durationHours * totalSessions;
    const commission = grossAmount * COMMISSION_RATE;
    const gstOnCommission = commission * GST_RATE_ON_COMMISSION;
    const tutorEarning = grossAmount - commission;
    if (isTutor) {
      // Tutors see their net earning after commission
      return {
        displayAmount: tutorEarning,
        totalSessions: totalSessions,
        breakdown: {
          totalSessions,
          durationHours,
          pricePerHour: booking.price,
          grossAmount,
          commission,
          gstOnCommission,
          tutorEarning,
        },
      };
    } else {
      // Students see the gross amount only (platform absorbs GST)
      const totalAmountForStudent = grossAmount;
      return {
        displayAmount: totalAmountForStudent,
        totalSessions: totalSessions,
        breakdown: null,
      };
    }
  } catch (err) {
    console.error("Error calculating total price:", err);
    return { displayAmount: 0, totalSessions: 0, breakdown: null };
  }
}
/* -------------------------------------------------------------------------- */
/* BookingCard Component (Unchanged otherwise) */
/* -------------------------------------------------------------------------- */
export default function BookingCard({ booking, isTutor, onAccept, onReject }) {
  const navigate = useNavigate();
  // --- STATE (FROM BOTH) ---
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [dialogData, setDialogData] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "OK",
    onConfirm: () => setDialogData((prev) => ({ ...prev, isOpen: false })),
  });
  const [isClassTime, setIsClassTime] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [isLiveNow, setIsLiveNow] = useState(false);

  const [isFutureDate, setIsFutureDate] = useState(false);

  // --- STATE: For total amount and sessions ---
  const [paymentDetails, setPaymentDetails] = useState({
    displayAmount: 0,
    totalSessions: 0,
    breakdown: null,
  });

  // Common refs
  const showClassTimerRef = useRef(null);
  const hideClassTimerRef = useRef(null);
  // --- DATA EXTRACTION (CONDITIONAL) ---
  const student = booking.studentId || {};
  const tutor = booking.tutorId || booking.tutor || {};
  const displayUser = isTutor ? student : tutor;
  const displayName =
    displayUser.fullName || (isTutor ? "Unknown Student" : "Unknown Tutor");

  const profilePhoto =
    displayUser.profilePhoto && !displayUser.profilePhoto.startsWith("http")
      ? `${import.meta.env.VITE_APP_BASE_URL}/${displayUser.profilePhoto}`
      : displayUser.profilePhoto || "/app-logo-black.png";
  const tutorTimezone = tutor.timezone || "Asia/Kolkata";
  // --- FORMAT HELPERS (Updated: Use TZ for Date Formatting) ---
  const formatLocalDate = (date) => {
    if (!date) return "";
    return new Intl.DateTimeFormat("en-US", {
      timeZone: tutorTimezone,
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  };
  const formatTime = (time) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };
  // --- DYNAMIC TIME LOGIC (Updated: Consistent TZ Date Strings) ---
  useEffect(() => {
    clearTimeout(showClassTimerRef.current);
    clearTimeout(hideClassTimerRef.current);

    if (booking.status !== "active") {
      setIsClassTime(false);
      setIsLiveNow(false);
      setIsFutureDate(false);
      return;
    }

    const now = new Date();
    const nowMs = now.getTime();
    const tutorTimezone = tutor.timezone || "Asia/Kolkata";

    const todayInTutorTzStr = getLocalDateStr(now, tutorTimezone);
    const startDateStr = getLocalDateStr(booking.startDate, tutorTimezone);

    // Check if the start date is in the absolute future
    setIsFutureDate(todayInTutorTzStr < startDateStr);

    const todayDayAbbr = new Intl.DateTimeFormat("en-US", {
      timeZone: tutorTimezone,
      weekday: "short",
    }).format(now);

    const endDateStr = booking.endDate
      ? getLocalDateStr(booking.endDate, tutorTimezone)
      : null;

    let isClassDay = false;
    if (booking.sessionType === "single") {
      isClassDay = todayInTutorTzStr === startDateStr;
    } else {
      const isWithinDateRange =
        todayInTutorTzStr >= startDateStr &&
        (!endDateStr || todayInTutorTzStr <= endDateStr);
      const isTodayADayOfWeek = booking.availableDays.includes(todayDayAbbr);
      isClassDay = isWithinDateRange && isTodayADayOfWeek;
    }

    if (isClassDay) {
      const classStartTimeUTC = constructLocalDateTime(
        todayInTutorTzStr,
        booking.startTime,
        tutorTimezone,
      );
      const classEndTimeUTC = constructLocalDateTime(
        todayInTutorTzStr,
        booking.endTime,
        tutorTimezone,
      );

      if (classStartTimeUTC && classEndTimeUTC) {
        const startMs = classStartTimeUTC.getTime();
        const endMs = classEndTimeUTC.getTime();

        // If class hasn't ended yet today
        if (nowMs < endMs) {
          setIsClassTime(true);

          if (nowMs >= startMs) {
            setIsLiveNow(true);
          } else {
            setIsLiveNow(false);
            // Timer to turn on "Live" mode when class starts
            showClassTimerRef.current = setTimeout(
              () => setIsLiveNow(true),
              startMs - nowMs,
            );
          }

          // Timer to turn off both when class ends
          hideClassTimerRef.current = setTimeout(() => {
            setIsClassTime(false);
            setIsLiveNow(false);
          }, endMs - nowMs);
        } else {
          // Class already ended today
          setIsClassTime(false);
          setIsLiveNow(false);
        }
      }
    } else {
      setIsClassTime(false);
      setIsLiveNow(false);
    }

    return () => {
      clearTimeout(showClassTimerRef.current);
      clearTimeout(hideClassTimerRef.current);
    };
  }, [booking, tutor.timezone]);

  useEffect(() => {
    if (booking) {
      const details = calculateTotals(booking, isTutor);
      setPaymentDetails(details);
    }
  }, [booking, isTutor]);
  // --- STATUS CONFIG (COMMON) ---
  const statusConfig = {
    pending: {
      icon: FaExclamationTriangle,
      bgColor: "#fef3c7",
      iconColor: "var(--primary-color)",
      label: "Pending Approval",
      textColor: "var(--brand-black)",
    },
    accepted: {
      icon: FaCheckCircle,
      bgColor: "#d1fae5",
      iconColor: "var(--primary-color)",
      label: "Accepted",
      textColor: "var(--brand-black)",
    },
    active: {
      icon: FaCheckCircle,
      bgColor: "#d1fae5",
      iconColor: "var(--primary-color)",
      label: "Active",
      textColor: "var(--brand-black)",
    },
    rejected: {
      icon: FaTimesCircle,
      bgColor: "#fee2e2",
      iconColor: "var(--secondary-color)",
      label: "Rejected",
      textColor: "var(--brand-black)",
    },
    expired: {
      icon: FaTimesCircle,
      bgColor: "#f3f4f6",
      iconColor: "var(--secondary-color)",
      label: "Expired",
      textColor: "var(--brand-black)",
    },
    completed: {
      icon: FaCheckCircle,
      bgColor: "#d1fae5",
      iconColor: "var(--primary-color)",
      label: "Completed",
      textColor: "var(--brand-black)",
    },
  };
  const currentStatus = statusConfig[booking.status] || statusConfig.pending;
  const StatusIcon = currentStatus.icon;
  // --- DERIVED BOOLEANS (USED BY BOTH) ---
  const isPending = booking.status === "pending";
  const isAccepted = booking.status === "accepted";
  const isActive = booking.status === "active";
  const isOnline = booking.tutoringMode.includes("Online Tutoring");
  // const canStartClass = isOnline && isActive && isClassTime;
  const canStartClass = isOnline && isActive && isLiveNow;

  const isFutureClass =
    isOnline && isActive && !isLiveNow && (isClassTime || isFutureDate);

  // const isFutureClass = isOnline && isActive && !isLiveNow;

  // --- HANDLERS (ALL) ---d
  const handleStartClass = () => {
    navigate(`/video-call/${booking._id}`, { state: { booking, isTutor } });
  };
  // --- Tutor Handlers (Updated: Local Status Update) ---
  const handleAccept = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await acceptBooking(booking._id);
      booking.status = "accepted"; // Local update
      if (onAccept) {
        onAccept(booking._id);
      }
    } catch (error) {
      console.error("Error accepting booking:", error);
      setDialogData({
        isOpen: true,
        title: "Error",
        message: error.message || "Failed to accept booking. Please try again.",
        confirmText: "OK",
        onConfirm: () => setDialogData((prev) => ({ ...prev, isOpen: false })),
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleSubmitReject = async () => {
    if (isLoading || !rejectReason.trim()) return;
    setIsLoading(true);
    try {
      await rejectBooking(booking._id, rejectReason);
      booking.status = "rejected"; // Local update
      booking.rejectionReason = rejectReason; // Update local booking
      if (onReject) {
        onReject(booking._id, rejectReason);
      }
      setShowRejectReason(false);
      setRejectReason("");
    } catch (error) {
      console.error("Error rejecting booking:", error);
      setDialogData({
        isOpen: true,
        title: "Error",
        message: error.message || "Failed to reject booking. Please try again.",
        confirmText: "OK",
        onConfirm: () => setDialogData((prev) => ({ ...prev, isOpen: false })),
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleCancelReject = () => {
    setShowRejectReason(false);
    setRejectReason("");
  };
  // --- Student Handlers ---
  const handlePay = async () => {
    // Prevent payment for trial bookings (Guard clause)
    if (booking.isTrial) {
      setDialogData({
        isOpen: true,
        title: "Trial Booking",
        message: "This is a free trial booking and does not require payment.",
        confirmText: "OK",
        onConfirm: () => setDialogData((prev) => ({ ...prev, isOpen: false })),
      });
      return;
    }

    try {
      const orderResponse = await createBookingOrder({
        bookingId: booking._id,
      });
      const orderData = orderResponse.data;
      await handlePayment({
        order: orderData,
        onError: (err) => {
          console.error("Payment failed:", err);
          setDialogData({
            isOpen: true,
            title: "Payment Failed",
            message: "Payment failed or cancelled. Please try again.",
            confirmText: "Close",
            onConfirm: () =>
              setDialogData((prev) => ({ ...prev, isOpen: false })),
          });
        },
        onSuccess: async (response) => {
          try {
            const verifyResponse = await verifyBookingPayment({
              orderId: response.razorpay_order_id,
              bookingId: booking._id,
            });
            setDialogData({
              isOpen: true,
              title: "Payment Successful",
              message:
                "Your payment was successful and the booking is now active.",
              confirmText: "OK",
              onConfirm: () => {
                setDialogData((prev) => ({ ...prev, isOpen: false }));
                Object.assign(booking, verifyResponse.data.booking);
              },
            });
          } catch (verifyError) {
            console.error("Payment verification failed:", verifyError);
            setDialogData({
              isOpen: true,
              title: "Verification Failed",
              message:
                "Payment was made but verification failed. Please contact support.",
              confirmText: "Close",
              onConfirm: () =>
                setDialogData((prev) => ({ ...prev, isOpen: false })),
            });
          }
        },
      });
    } catch (error) {
      console.error("Error during payment initialization:", error);
      setDialogData({
        isOpen: true,
        title: "Payment Error",
        message:
          error.message || error || "Unable to start payment. Try again later.",
        confirmText: "Close",
        onConfirm: () => setDialogData((prev) => ({ ...prev, isOpen: false })),
      });
    }
  };
  const handleViewProfile = () => {
    navigate(`/tutor-details/${tutor._id}`);
  };

  // --- Rating Handler (Student Only) ---
  const handleRatingChange = async (newRating) => {
    if (isSubmittingRating) return;
    setIsSubmittingRating(true);
    try {
      await submitRating({ bookingId: booking._id, rating: newRating });
      booking.rating = newRating;
      booking.ratedAt = new Date();
      setDialogData({
        isOpen: true,
        title: "Rating Submitted",
        message: `You rated this class ${newRating} star${newRating !== 1 ? "s" : ""}. Thank you for your feedback!`,
        confirmText: "OK",
        onConfirm: () => setDialogData((prev) => ({ ...prev, isOpen: false })),
      });
    } catch (error) {
      console.error("Error submitting rating:", error);
      setDialogData({
        isOpen: true,
        title: "Error",
        message: error.message || "Failed to submit rating. Please try again.",
        confirmText: "OK",
        onConfirm: () => setDialogData((prev) => ({ ...prev, isOpen: false })),
      });
    } finally {
      setIsSubmittingRating(false);
    }
  };
  // --- BREAKDOWN MODAL PORTAL ---
  const BreakdownModal = () => {
    if (typeof document === "undefined") return null;
    return createPortal(
      <div
        className="breakdown-overlay"
        onClick={() => setShowBreakdown(false)}
      >
        <div className="breakdown-content" onClick={(e) => e.stopPropagation()}>
          <h4>Earning Breakdown</h4>
          <div className="breakdown-item">
            <span>Total Sessions:</span>
            <span>{paymentDetails.breakdown.totalSessions}</span>
          </div>
          <div className="breakdown-item">
            <span>Duration per Session:</span>
            <span>
              {paymentDetails.breakdown.durationHours.toFixed(1)} hours
            </span>
          </div>
          <div className="breakdown-item">
            <span>Price per Hour:</span>
            <span>
              {paymentDetails.breakdown.pricePerHour.toFixed(2)}{" "}
              {booking.currency}
            </span>
          </div>
          <div className="breakdown-item">
            <span>Gross Amount:</span>
            <span>
              {paymentDetails.breakdown.grossAmount.toFixed(2)}{" "}
              {booking.currency}
            </span>
          </div>
          <div className="breakdown-item">
            <span>Commission (5%):</span>
            <span>
              {paymentDetails.breakdown.commission.toFixed(2)}{" "}
              {booking.currency}
            </span>
          </div>
          <div className="breakdown-item">
            <span>GST on Commission (18%):</span>
            <span>
              {paymentDetails.breakdown.gstOnCommission.toFixed(2)}{" "}
              {booking.currency}
            </span>
          </div>
          <div className="breakdown-item total">
            <span>Your Earning:</span>
            <span>
              {paymentDetails.breakdown.tutorEarning.toFixed(2)}{" "}
              {booking.currency}
            </span>
          </div>
          <button onClick={() => setShowBreakdown(false)}>Close</button>
        </div>
      </div>,
      document.body,
    );
  };
  return (
    <div className="booking-card">
      {/* --- HEADER (CONDITIONAL) --- */}
      <div className="booking-header">
        <div className="tutor-info">
          <img
            src={profilePhoto}
            alt={displayName}
            className="tutor-avatar"
            onError={(e) => {
              e.target.src = "/app-logo-black.png";
            }}
          />
          <div className="tutor-details">
            <h3 className="tutor-name">{displayName}</h3>
            {!isTutor && (
              <p className="tutor-headline">
                {tutor.headline || "Experienced Tutor"}
              </p>
            )}
            <div className="requested-at">
              <span>Requested at {formatLocalDate(booking.createdAt)}</span>
            </div>
          </div>
        </div>
        <div className="status-container">
          <div
            className="status-badge"
            style={{
              backgroundColor: currentStatus.bgColor,
              color: currentStatus.textColor,
            }}
          >
            <StatusIcon style={{ color: currentStatus.iconColor }} />
            <span>{currentStatus.label}</span>
          </div>
          {booking.status === "rejected" && (
            <p className="rejection-note">
              Reason: {booking.rejectionReason || "No reason provided"}
            </p>
          )}
        </div>
      </div>
      {/* --- BODY (COMMON) --- */}
      <div className="booking-body">
        <div className="detail-grid">
          <div className="detail-tile">
            <div className="tile-content">
              <span className="tile-label">Subject</span>
              <span className="tile-value">{booking.subject}</span>
            </div>
          </div>
          <div className="detail-tile">
            <div className="tile-content">
              <span className="tile-label">Date & Time</span>
              <span className="tile-value">
                {formatLocalDate(booking.startDate)}
                <br />
                {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
              </span>
            </div>
          </div>
          {/* --- TILE: SESSIONS & PRICE --- */}
          <div className="detail-tile">
            <div className="tile-content">
              <span className="tile-label">Sessions & Price</span>
              <span className="tile-value">
                {paymentDetails.totalSessions} Session
                {paymentDetails.totalSessions !== 1 ? "s" : ""}
                <br />
                {booking.isTrial ? (
                  <span className="trial-badge">Free Trial Session</span>
                ) : (
                  <>
                    <span className="price-value">
                      {paymentDetails.displayAmount.toFixed(2)}{" "}
                      {booking.currency}
                      <span className="price-label-inline">
                        {isTutor ? " (Total Earning)" : " (Total Price)"}
                      </span>
                      {isTutor && paymentDetails.breakdown && (
                        <button
                          className="breakdown-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowBreakdown(true);
                          }}
                          title="View breakdown"
                        >
                          <FaInfoCircle size={12} />
                        </button>
                      )}
                    </span>
                  </>
                )}
              </span>
            </div>
          </div>
          {/* --- END TILE --- */}
          {booking.sessionType === "multiple" && (
            <div className="detail-tile">
              <div className="tile-content">
                <span className="tile-label">Recurring</span>
                <span className="tile-value">
                  {booking.availableDays.join(", ")}
                  <br />
                  {booking.endDate
                    ? `Ends ${formatLocalDate(booking.endDate)}`
                    : "Ongoing"}
                </span>
              </div>
            </div>
          )}
          <div className="detail-tile mode-tile">
            <div className="tile-content">
              <span className="tile-label">Mode</span>
              <div className="mode-tags">
                {booking.tutoringMode.map((mode) => {
                  const modeClass =
                    mode === "Online Tutoring" ? "online" : "in-person";
                  const Icon =
                    mode === "Online Tutoring" ? FaVideo : FaMapMarkerAlt;
                  return (
                    <span key={mode} className={`mode-tag ${modeClass}`}>
                      <Icon />
                      {mode}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* --- RATING SECTION (For Completed Bookings) --- */}
        {booking.status === "completed" && (
          <div className="detail-tile rating-tile">
            <div className="tile-content">
              <span className="tile-label">
                {isTutor ? "Student Rating" : "Rate This Class"}
              </span>
              <div className="rating-content">
                {isTutor ? (
                  // Tutor view: Read-only, show only if rated
                  booking.rating ? (
                    <StarRating rating={booking.rating} editable={false} />
                  ) : (
                    <span className="no-rating-text">Not rated yet</span>
                  )
                ) : (
                  // Student view: Editable if not rated, read-only if rated
                  <>
                    <StarRating
                      rating={booking.rating || 0}
                      editable={!booking.rating && !isSubmittingRating}
                      onChange={handleRatingChange}
                    />
                    {booking.rating && (
                      <span className="rating-label">
                        You rated {booking.rating}/5
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      {/* --- MODIFIED FOOTER --- */}
      <div className="booking-footer">
        {/* --- RE-ADDED PRICE SECTION (BOTTOM-LEFT) --- */}
        <div className="price-section">
          {booking.isTrial || !booking.price ? (
            <>
              <span className="price-amount">Trial Session</span>
            </>
          ) : (
            <>
              <span className="price-amount">
                {booking.price} {booking.currency}
              </span>
              <span className="price-label">/ session</span>
            </>
          )}
        </div>

        <div className="action-section">
          {isTutor ? (
            // --- TUTOR ACTIONS ---
            isPending ? (
              showRejectReason ? (
                <div className="reject-form">
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Enter reason for rejection..."
                    rows={3}
                    className="reject-textarea"
                    disabled={isLoading}
                  />
                  <div className="reject-buttons">
                    <button
                      className="reject-submit-btn"
                      onClick={handleSubmitReject}
                      disabled={isLoading || !rejectReason.trim()}
                    >
                      {isLoading ? "Submitting..." : "Submit Rejection"}
                    </button>
                    <button
                      className="reject-cancel-btn"
                      onClick={handleCancelReject}
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    className="accept-btn"
                    onClick={handleAccept}
                    disabled={isLoading}
                  >
                    {isLoading ? "Accepting..." : "Accept"}
                  </button>
                  <button
                    className="reject-btn"
                    onClick={() => setShowRejectReason(true)}
                    disabled={isLoading}
                  >
                    Reject
                  </button>
                </>
              )
            ) : (
              <>
                {/* TUTOR START CLASS */}
                {canStartClass && (
                  <button
                    className="start-class-btn highlight-flash"
                    onClick={handleStartClass}
                  >
                    Start Class
                  </button>
                )}

                {/* TUTOR FUTURE SCHEDULE */}
                {isFutureClass && (
                  // <div className="start-class-btn highlight-flash future-schedule">

                  //   {formatLocalDate(booking.startDate)}{" "}
                  //   {formatTime(booking.startTime)}
                  // </div>
                  <div className="start-class-btn highlight-flash future-schedule">
                    <span className="join-text">Join Class at</span>

                    <span className="date-time">
                      {formatLocalDate(booking.startDate)}{" "}
                      {formatTime(booking.startTime)}
                    </span>
                  </div>
                )}
              </>
            )
          ) : (
            // --- STUDENT ACTIONS ---
            <>
              <button className="profile-btn" onClick={handleViewProfile}>
                View Profile
              </button>

              {isAccepted && !booking.isTrial && (
                <button className="pay-btn" onClick={handlePay}>
                  Pay Now
                </button>
              )}

              {/* STUDENT JOIN CLASS (LIVE NOW) */}
              {canStartClass && (
                <button
                  className="start-class-btn highlight-flash"
                  onClick={handleStartClass}
                >
                  Join Class
                </button>
              )}

              {/* STUDENT FUTURE SCHEDULE */}
              {isFutureClass && (
                <div className="start-class-btn highlight-flash future-schedule">
                  <span className="join-text">Join Class at</span>

                  <span className="date-time">
                    {formatLocalDate(booking.startDate)}{" "}
                    {formatTime(booking.startTime)}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {/* --- END MODIFIED FOOTER --- */}
      {/* --- BREAKDOWN MODAL PORTAL --- */}
      {showBreakdown && paymentDetails.breakdown && <BreakdownModal />}
      {/* --- UNIFIED DIALOG --- */}
      <ConfirmDialog
        {...dialogData}
        onCancel={() => setDialogData((prev) => ({ ...prev, isOpen: false }))}
        closeOnBackdrop={true}
      />
    </div>
  );
}
