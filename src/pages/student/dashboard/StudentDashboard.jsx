import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
// 1. Import useSearchParams
import { useParams, useSearchParams } from "react-router-dom";
import {
  getTutors,
  checkTrialAvailability,
  getUpcomingClasses,
} from "../../../data/modules/student-module";
import TutorCard from "../../../components/tutor-card/TutorCard";
import Loading from "../../../components/loading/Loading";
import MultiSelect from "../../../components/multiselect/MultiSelect";
import ClassReminderBanner from "../../../components/class-reminder-banner/ClassReminderBanner";
import {
  getCategories,
  getSubCategories,
} from "../../../data/modules/dynamic-module";
import { FaFilter, FaSearch } from "react-icons/fa";
import "./StudentDashboard.css";

// Debounce hook (Unchanged)
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};

// --- UPDATED HELPER ---
// Use .getAll() to correctly read multiple params
const getArrayFromParams = (params, key) => {
  return params.getAll(key);
};

export default function StudentDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();

  const { category, mode, subject } = useParams();

  const formatFromUrl = (str) => {
    if (!str || str.includes("all-") || str.includes("any-")) return null;
    return decodeURIComponent(str)
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Tutors and Loading
  const [tutors, setTutors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [canTrial, setCanTrial] = useState(false);

  // Static options
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const modeOptions = ["Home Tutoring", "At Tutor Place", "Online Tutoring"];
  const daysOptions = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const timeOptions = [
    "0-3",
    "3-6",
    "6-9",
    "9-12",
    "12-15",
    "15-18",
    "18-21",
    "21-24",
  ];

  // Pagination State
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  // Mobile/UI State
  const [showFilters, setShowFilters] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Class Reminder State
  const [activeReminders, setActiveReminders] = useState([]);
  const timersRef = useRef([]);

  // Derive state from searchParams (uses new getArrayFromParams)
  const { page, sortBy, searchQuery, filters } = useMemo(() => {
    const page = Number(searchParams.get("page")) || 1;
    const sortBy = searchParams.get("sortBy") || "relevance";
    const searchQuery = searchParams.get("search") || "";

    // Get arrays from Query Params (?subjects=Math)
    let subjectsFromQuery = getArrayFromParams(searchParams, "subjects");
    let modeFromQuery = getArrayFromParams(searchParams, "mode");

    // Get single values from Path Params (/academics/online/math)
    const subjectFromPath = formatFromUrl(subject);
    const modeFromPath = formatFromUrl(mode);

    // Merge them: Priority to Path, then add Query selections
    const finalSubjects = subjectFromPath
      ? [...new Set([subjectFromPath, ...subjectsFromQuery])]
      : subjectsFromQuery;

    const finalModes = modeFromPath
      ? [...new Set([modeFromPath, ...modeFromQuery])]
      : modeFromQuery;

    const filters = {
      mode: finalModes,
      subjects: finalSubjects,
      priceMin: searchParams.get("priceMin") || "",
      priceMax: searchParams.get("priceMax") || "",
      days: getArrayFromParams(searchParams, "days"),
      timeRanges: getArrayFromParams(searchParams, "timeRanges"),
    };

    return { page, sortBy, searchQuery, filters };
  }, [searchParams, category, mode, subject]);

  // Local state for debouncing search (Unchanged)
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const debouncedSearchQuery = useDebounce(localSearch, 500);

  // Effect to update URL from debounced search (Unchanged)
  useEffect(() => {
    if (debouncedSearchQuery !== searchQuery) {
      const newParams = new URLSearchParams(searchParams);
      if (debouncedSearchQuery) {
        newParams.set("search", debouncedSearchQuery);
      } else {
        newParams.delete("search");
      }
      newParams.set("page", "1");
      setSearchParams(newParams, { replace: true });
    }
  }, [debouncedSearchQuery, searchQuery, searchParams, setSearchParams]);

  // Main data fetching function
  // const fetchTutors = useCallback(async () => {
  //   setIsLoading(true);
  //   try {
  //     const params = new URLSearchParams(searchParams); // It will still work with the object
  //     const { tutors: fetchedTutors, pagination } = await getTutors(params);
  //     setTutors(fetchedTutors);
  //     setTotalPages(pagination.pages);
  //     setTotalResults(pagination.total);
  //   } catch (error) {
  //     console.error(error);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // }, [searchParams.toString()]);

  const fetchTutors = useCallback(async () => {
    setIsLoading(true);
    try {
      // Create a combined set of params for the API
      const apiParams = new URLSearchParams(searchParams);

      // If path params exist, ensure they are sent to the backend
      if (formatFromUrl(subject))
        apiParams.append("subjects", formatFromUrl(subject));
      if (formatFromUrl(mode)) apiParams.append("mode", formatFromUrl(mode));

      const { tutors: fetchedTutors, pagination } = await getTutors(apiParams);
      setTutors(fetchedTutors);
      setTotalPages(pagination.pages);
      setTotalResults(pagination.total);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [searchParams, subject, mode]);

  // Fetch static data on mount (Unchanged)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);

    async function fetchStaticData() {
      checkTrialAvailability()
        .then((data) => setCanTrial(data.canTakeTrial))
        .catch((err) => console.error("Trial check failed:", err));
      try {
        const cats = await getCategories();
        if (Array.isArray(cats)) {
          setCategories(cats);
          const subsPromises = cats.map((cat) =>
            getSubCategories({ category: cat }).catch((err) => {
              console.error(`Failed to fetch subs for ${cat}:`, err);
              return [];
            }),
          );
          const subsResults = await Promise.all(subsPromises);
          setSubCategories(subsResults.flat());
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    }

    fetchStaticData();
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetch and schedule upcoming class reminders
  useEffect(() => {
    async function setupClassReminders() {
      try {
        const data = await getUpcomingClasses();
        const { classes } = data;

        if (!classes || classes.length === 0) return;

        // Clear any existing timers
        timersRef.current.forEach((timer) => clearTimeout(timer));
        timersRef.current = [];

        const now = new Date();

        classes.forEach((classInfo) => {
          const classStart = new Date(classInfo.startDateTime);
          const fiveMinutesBefore = new Date(
            classStart.getTime() - 5 * 60 * 1000,
          );
          const timeUntilShow = fiveMinutesBefore - now;
          const timeUntilHide = timeUntilShow + 10 * 60 * 1000; // Hide 10 minutes after showing

          // If the banner should already be showing
          if (timeUntilShow <= 0 && timeUntilHide > 0) {
            setActiveReminders((prev) => {
              // Avoid duplicates
              if (prev.some((r) => r.bookingId === classInfo.bookingId))
                return prev;
              return [...prev, classInfo];
            });

            // Schedule hiding
            const hideTimer = setTimeout(() => {
              setActiveReminders((prev) =>
                prev.filter((r) => r.bookingId !== classInfo.bookingId),
              );
            }, timeUntilHide);
            timersRef.current.push(hideTimer);
          }
          // If the banner should show in the future
          else if (timeUntilShow > 0) {
            // Schedule showing
            const showTimer = setTimeout(() => {
              setActiveReminders((prev) => {
                if (prev.some((r) => r.bookingId === classInfo.bookingId))
                  return prev;
                return [...prev, classInfo];
              });

              // Schedule hiding (10 minutes after showing)
              const hideTimer = setTimeout(
                () => {
                  setActiveReminders((prev) =>
                    prev.filter((r) => r.bookingId !== classInfo.bookingId),
                  );
                },
                10 * 60 * 1000,
              );
              timersRef.current.push(hideTimer);
            }, timeUntilShow);
            timersRef.current.push(showTimer);
          }
        });
      } catch (error) {
        console.error("Error setting up class reminders:", error);
      }
    }

    setupClassReminders();

    // Cleanup timers on unmount
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current = [];
    };
  }, []);

  // Show/hide filters based on mobile view (Unchanged)
  useEffect(() => {
    setShowFilters(!isMobile);
  }, [isMobile]);

  // CORE LOGIC: Re-fetch tutors when searchParams change (Unchanged)
  useEffect(() => {
    fetchTutors();
  }, [fetchTutors]);

  // --- UPDATED HANDLERS ---

  // This is the key change to handle array params
  const handleFilterChange = (key, value) => {
    const newParams = new URLSearchParams(searchParams);

    if (Array.isArray(value)) {
      // Delete all existing keys
      newParams.delete(key);
      // Append each new value
      if (value.length > 0) {
        value.forEach((item) => newParams.append(key, item));
      }
    } else {
      // Handle string/number values
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    }
    newParams.set("page", "1"); // Reset page
    setSearchParams(newParams, { replace: true });
  };

  const handlePriceMinChange = (e) => {
    handleFilterChange("priceMin", e.target.value);
  };

  const handlePriceMaxChange = (e) => {
    handleFilterChange("priceMax", e.target.value);
  };

  const handleSortByChange = (e) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("sortBy", e.target.value);
    newParams.set("page", "1");
    setSearchParams(newParams, { replace: true });
  };

  // Clear filters (Unchanged)
  const clearFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true });
    setLocalSearch("");
    if (isMobile) setShowFilters(false);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Page change (Unchanged)
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("page", newPage.toString());
      setSearchParams(newParams);
    }
  };

  // --- RENDER ---

  if (isLoading && page === 1 && tutors.length === 0) {
    return <Loading />;
  }

  const handleCloseReminder = (bookingId) => {
    setActiveReminders((prev) => prev.filter((r) => r.bookingId !== bookingId));
  };

  return (
    <div className="student-dashboard">
      {/* Search (Unchanged) */}
      <div className="search-section">
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search tutors by name, subject, or description..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Class Reminders */}
      {activeReminders.length > 0 && (
        <div className="class-reminders-container">
          {activeReminders.map((classInfo) => (
            <ClassReminderBanner
              key={classInfo.bookingId}
              classInfo={classInfo}
              onClose={() => handleCloseReminder(classInfo.bookingId)}
            />
          ))}
        </div>
      )}

      {/* Mobile Toggle (Unchanged) */}
      {isMobile && (
        <div className="filter-toggle-section">
          <button className="filter-toggle-btn" onClick={toggleFilters}>
            <FaFilter />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
        </div>
      )}

      {/* Filters (Unchanged, but values now read from new state) */}
      <div
        className={`filters-section ${!showFilters && isMobile ? "hidden" : ""}`}
      >
        <div className="filter-row primary-filters">
          <div className="filter-group">
            <MultiSelect
              name="mode"
              placeholder="Mode of Tutoring"
              options={modeOptions}
              value={filters.mode}
              onChange={(items) => handleFilterChange("mode", items)}
            />
          </div>
          <div className="filter-group">
            <MultiSelect
              name="subjects"
              placeholder="Subjects"
              options={subCategories}
              max={5}
              value={filters.subjects}
              onChange={(items) => handleFilterChange("subjects", items)}
            />
          </div>
          <div className="filter-group price-filter">
            <div className="price-inputs">
              <input
                type="number"
                min="0"
                placeholder="Min Price"
                value={filters.priceMin}
                onChange={handlePriceMinChange}
              />
              <span>-</span>
              <input
                type="number"
                min="0"
                placeholder="Max Price"
                value={filters.priceMax}
                onChange={handlePriceMaxChange}
              />
            </div>
          </div>
        </div>
        <div className="filter-row secondary-filters">
          <div className="filter-group">
            <MultiSelect
              name="days"
              placeholder="Days"
              options={daysOptions}
              value={filters.days}
              onChange={(items) => handleFilterChange("days", items)}
            />
          </div>
          <div className="filter-group">
            <MultiSelect
              name="timeRanges"
              placeholder="Time Ranges"
              options={timeOptions}
              value={filters.timeRanges}
              onChange={(items) => handleFilterChange("timeRanges", items)}
            />
          </div>
          <div className="filter-group sort-group">
            <select value={sortBy} onChange={handleSortByChange}>
              <option value="relevance">Sort by: Relevance</option>
              <option value="new">Sort by: New tutors</option>
              <option value="price-low">Sort by: Price (Low-High)</option>
              <option value="price-high">Sort by: Price (High-Low)</option>
            </select>
          </div>
        </div>
        <div className="clear-section">
          <button className="clear-btn" type="button" onClick={clearFilters}>
            Clear All
          </button>
        </div>
      </div>

      {/* Loading/List (Unchanged) */}
      {isLoading && (
        <div className="loading-overlay">
          <Loading />
        </div>
      )}
      <div className="tutors-list">
        {tutors.length === 0 ? (
          <p className="no-results">
            {totalResults === 0 && !isLoading
              ? "No tutors found matching your criteria."
              : ""}
          </p>
        ) : (
          tutors.map((tutor) => (
            <div key={tutor._id}>
              <TutorCard tutor={tutor} canTrial={canTrial} />
            </div>
          ))
        )}
      </div>

      {/* Pagination (Unchanged) */}
      {totalPages > 1 && (
        <div className="pagination-controls">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1 || isLoading}
          >
            &laquo; Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages || isLoading}
          >
            Next &raquo;
          </button>
        </div>
      )}
    </div>
  );
}
