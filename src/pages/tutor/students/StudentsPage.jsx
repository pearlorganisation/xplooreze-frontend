import './StudentsPage.css';
import TutorSidebar from '../../../components/tutor-sidebar/TutorSidebar';
import { useState, useEffect } from 'react';
import { getStudents } from '../../../data/modules/tutor-module';

// A separate component for the student tile
function StudentTile({ student }) {
    const location = [student.city, student.country].filter(Boolean).join(', ');

    return (
        <div className="student-tile">
            <header className="tile-header">
                <img
                    src={student.profilePhoto ? `${import.meta.env.VITE_APP_BASE_URL}/${student.profilePhoto}` : 'https://via.placeholder.com/100'}
                    alt={student.fullName}
                    className="student-photo"
                />
                <div className="student-identity">
                    <h3 className="student-name">{student.fullName || 'N/A'}</h3>
                    <p className="student-email">{student.email}</p>
                </div>
            </header>
            <div className="student-details">
                <div className="detail-item">
                    <span className="detail-label">Location</span>
                    <span className="detail-value">{location || 'N/A'}</span>
                </div>
                <div className="detail-item">
                    <span className="detail-label">Student Type</span>
                    <span className="detail-value">{student.student_type || 'N/A'}</span>
                </div>
                <div className="detail-item">
                    <span className="detail-label">Timezone</span>
                    <span className="detail-value">{student.timezone || 'N/A'}</span>
                </div>
            </div>
        </div>
    );
}

// Main page component
export function StudentsPage() {
    const [showSidebar, setShowSidebar] = useState(false);

    // State for data, loading, and pagination
    const [students, setStudents] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch students when the page changes
    useEffect(() => {
        const fetchStudents = async () => {
            try {
                setIsLoading(true);
                setError(null);
                // Using limit: 9 for a 3-column tile layout
                const data = await getStudents({ page: currentPage, limit: 9 });
                setStudents(data.students);
                setPagination(data.pagination);
            } catch (err) {
                setError(err.message || 'Failed to fetch students.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchStudents();
    }, [currentPage]); // Re-run effect when currentPage changes

    // --- Helper function to render the main content ---
    const renderContent = () => {
        if (isLoading) {
            return <p className="loading-text">Loading students...</p>;
        }

        if (error) {
            return <p className="error-text">Error: {error}</p>;
        }

        if (students.length === 0) {
            return <p>No Students At This Time</p>;
        }

        return (
            <>
                <div className="students-list">
                    {students.map((student) => (
                        <StudentTile key={student._id} student={student} />
                    ))}
                </div>

                {pagination && pagination.pages > 1 && (
                    <PaginationComponent
                        currentPage={currentPage}
                        totalPages={pagination.pages}
                        onPageChange={setCurrentPage}
                    />
                )}
            </>
        );
    };

    return (
        <div className="students-container">
            <TutorSidebar showSidebar={showSidebar} setShowSidebar={setShowSidebar} />
            <main className="students-main">
                <div className="topbar">
                    <button className="menu-toggle" onClick={() => setShowSidebar(!showSidebar)}>
                        &#9776;
                    </button>
                    <div className="title">Students</div>
                </div>
                
                {/* Content area */}
                <div className="students-content">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
}

// --- Simple Pagination Component ---
function PaginationComponent({ currentPage, totalPages, onPageChange }) {
    return (
        <div className="pagination-controls">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
            >
                &larr; Previous
            </button>
            <span>
                Page {currentPage} of {totalPages}
            </span>
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
            >
                Next &rarr;
            </button>
        </div>
    );
}