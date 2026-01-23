import { useRef } from 'react';
import './TutorSidebar.css';
import { 
    FaChalkboardTeacher, 
    FaMoneyBill, 
    FaTachometerAlt, 
    FaTools, 
    FaUserGraduate, 
    FaUserPlus,
    FaLandmark // <-- Added new icon
} from 'react-icons/fa';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function TutorSidebar({ showSidebar, setShowSidebar }) {
    const location = useLocation();
    const sidebarRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (
                document.body.classList.contains('tutor-sidebar-open') &&
                sidebarRef.current &&
                !sidebarRef.current.contains(event.target)
                && showSidebar
            ) {
                document.body.classList.remove('tutor-sidebar-open');
                setShowSidebar(false);
            }
        }

        if (showSidebar) {
            document.body.classList.add('tutor-sidebar-open');
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showSidebar]);

    return (
        <aside className="tutor-sidebar" ref={sidebarRef}>
            <img src='/app-logo.png' />
            <nav className="tutor-sidebar-nav">
                <a href="/tutor-dashboard" className={location.pathname === '/tutor-dashboard' ? 'active' : ''}>
                    <FaTachometerAlt className="icon" />
                    Dashboard
                </a>
                <a href="/tutor-requests" className={location.pathname === '/tutor-requests' ? 'active' : ''}>
                    <FaUserPlus className="icon" />
                    Requests
                </a>
                <a href="/tutor-classes" className={location.pathname === '/tutor-classes' ? 'active' : ''}>
                    <FaChalkboardTeacher className="icon" />
                    Classes
                </a>
                {/* <a href="/tutor-students" className={location.pathname === '/tutor-students' ? 'active' : ''}>
                    <FaUserGraduate className="icon" />
                    Students
                </a> */}
                
                <a href="/tutor-payments" className={location.pathname === '/tutor-payments' ? 'active' : ''}>
                    <FaMoneyBill className="icon" />
                    Payments
                </a>
                <a href="/tutor-account" className={location.pathname === '/tutor-account' ? 'active' : ''}>
                    <FaTools className="icon" />
                    Account
                </a>

                {/* --- NEW LINK ADDED --- */}
                <a href="/tutor-bank-details" className={location.pathname === '/tutor-bank-details' ? 'active' : ''}>
                    <FaLandmark className="icon" />
                    Update Bank Details
                </a>
            </nav>
        </aside>

    );
}