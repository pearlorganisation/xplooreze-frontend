// NavBar.jsx
import "./NavBar.css";
import { useEffect, useRef, useState } from "react";

import { APP_NAME } from "../../data/config.js";
import { Link, useLocation, useMatch } from "react-router-dom";
import { useAuth } from "../../hooks/AuthProvider.jsx";
import NavBar from "./NavBar.jsx";

function StudentNavBar() {
  const { user, isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return <NavBar />;
  }

  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const location = useLocation();

  const isSearchPage = useMatch("/:category/:mode/:subject");

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <div className="logo">
          <a href="/">
            <img src="/x-icon.png" />
            <span>{APP_NAME.substring(0, 6)}</span>
            <span>{APP_NAME.substring(6)}</span>
          </a>
        </div>
        <ul className={`nav-links ${open ? "mobile" : ""}`} ref={ref}>
          {/* <li>
            <Link
              to="/student-dashboard"
              className={`nav-link ${location.pathname === "/student-dashboard" ? "active" : ""}`}
            >
              Find Tutors
            </Link>
          </li> */}
          <li>
            <Link
              to="/categories" // Redirect to categories to start search
              className={`nav-link ${isSearchPage || location.pathname === "/student-dashboard" ? "active" : ""}`}
            >
              Find Tutors
            </Link>
          </li>
          <li>
            <Link
              to="/student-classes"
              className={`nav-link ${location.pathname === "/student-classes" ? "active" : ""}`}
            >
              My Classes
            </Link>
          </li>
          <li>
            <Link
              to="/favourite-tutors"
              className={`nav-link ${location.pathname === "/favourite-tutors" ? "active" : ""}`}
            >
              Favourites
            </Link>
          </li>
          <li>
            <Link
              to="/phd-mentorship"
              className={`nav-link ${location.pathname === "/phd-mentorship" ? "active" : ""}`}
            >
              PhD Mentorship
            </Link>
          </li>
        </ul>
      </div>

      <div className="navbar-right">
        <div className="nav-actions">
          <a href="/student-account">
            <img
              src={`${import.meta.env.VITE_APP_BASE_URL}/${user?.profilePhoto ?? ""}`}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = import.meta.env.VITE_PROFILE_PHOTO_PLACEHOLDER;
              }}
              className="avatar"
            />
          </a>
        </div>
        <button className="menu-btn" onClick={() => setOpen(!open)}>
          <i className="fas fa-bars" />
        </button>
      </div>
    </nav>
  );
}

export default StudentNavBar;
