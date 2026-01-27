// NavBar.jsx
import "./NavBar.css";
import { useEffect, useRef, useState } from "react";

import { APP_NAME } from "../../data/config.js";
import { Link, useLocation, useNavigate } from "react-router-dom";

function NavBar() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

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
          <li>
            <Link
              to="/authentication?authType=registration&userRole=student"
              className={`nav-link ${location.pathname.includes("/authentication") ? "active" : ""}`}
            >
              Find a tutor
            </Link>
          </li>
          <li>
            <Link
              to="/authentication?authType=registration&userRole=tutor"
              className={`nav-link ${location.pathname.includes("/authentication") ? "active" : ""}`}
            >
              Become a tutor
            </Link>
          </li>
          {/* <li className='dropdown'>
            PhD mentorship
            <ul className='dropdown-menu'>
              <li>PhD assistance</li>
              <li>Research paper</li>
            </ul>
          </li> */}
          <li>
            <Link
              to="/phd-mentorship"
              className={`nav-link ${location.pathname === "/phd-mentorship" ? "active" : ""}`}
            >
              PhD Mentorship
            </Link>
          </li>
          <li>
            <Link
              to="/categories"
              className={`nav-link ${location.pathname === "/blogs" ? "active" : ""}`}
            >
              Category
            </Link>
          </li>
          <li>
            <Link
              to="/about-us"
              className={`nav-link ${location.pathname === "/about-us" ? "active" : ""}`}
            >
              About us
            </Link>
          </li>
          <li>
            <Link
              to="/blogs"
              className={`nav-link ${location.pathname === "/blogs" ? "active" : ""}`}
            >
              Blogs
            </Link>
          </li>
        </ul>
      </div>

      <div className="navbar-right">
        <div className="nav-actions">
          <button
            className="login-btn"
            onClick={() => navigate("/authentication?authtype=login")}
          >
            Log In
          </button>
        </div>
        <button className="menu-btn" onClick={() => setOpen(!open)}>
          <i className="fas fa-bars" />
        </button>
      </div>
    </nav>
  );
}

export default NavBar;
