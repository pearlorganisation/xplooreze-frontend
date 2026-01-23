import { Link } from "react-router-dom";
import HeaderTitle from "../../components/header-title/HeaderTitle";
import './AboutUsPage.css';
import { FaChartLine, FaHeart, FaUserAlt } from "react-icons/fa";

export default function AboutUsPage() {
    return (
        <div className="about-us">
            <div className="about-us-header">
                <HeaderTitle
                    title="Learning should feel like discovery."
                    description="At Xplooreze, we make tutoring personal, accessible, and safe."
                />
            </div>

            <div className="items">
                <div className="about-founder-card">
                    <img src="/founder.jpg" className="founder-img desktop" alt="Founder Image" />
                    <div className="about-founder-content">
                        <h1>Why I Started Xplooreze</h1>
                        <img src="/founder.jpg" className="founder-img phone" alt="Founder Image" />
                        <p>I’ve spent 17 years as a business management professor and an adtech expert, working with students from India, Singapore and the US. Over and over, I watched parents and learners struggle to find reliable, high-quality tutors.
                            <br /><br />Most online platforms felt impersonal, while offline searches were time-consuming and risky. Tutors, on the other hand, had a hard time reaching the right students.

                            <br /><br />I launched Xplooreze to bridge this gap a smart, safe platform that connects students and parents with verified tutors.

                            <br /><br />Thank you for visiting Xplooreze. I invite you to explore the platform, find the perfect tutor, or list yourself as one. Together, we can make learning more personal and effective.
                        </p>
                        <div className="cta-buttons">
                            <Link to='/authentication?authType=registration&userRole=student' className="primary-btn">Find a tutor</Link>
                            <Link to='/authentication?authType=registration&userRole=tutor' className="secondary-btn">Become a tutor</Link>
                        </div>
                    </div>
                </div>

                <div className="mission-and-values">
                    <div className="mission">
                        <h1>🌐 Our Mission</h1>
                        <p>We believe every learner deserves a guide not just a teacher.
                            Our mission is to connect families with trustworthy tutors who bring empathy, expertise, and energy to every session.
                        </p>
                    </div>
                    <div className="values">
                        <h1>Our Values</h1>
                        <p>We connect learners and tutors to spark positive change.</p>
                        <div className="values-items">
                            <div className="value-item">
                                <FaHeart className="icon" />
                                <h1>Trust</h1>
                                <p>Verified tutors. Transparent process.</p>
                            </div>

                            <div className="value-item">
                                <FaUserAlt className="icon" /> {/* Example: more relevant icon */}
                                <h1>Personalization</h1>
                                <p>Every learner is unique. So is our approach.</p>
                            </div>

                            <div className="value-item">
                                <FaChartLine className="icon" /> {/* Example: growth/analytics style icon */}
                                <h1>Growth</h1>
                                <p>For students, tutors, and the platform itself.</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="where-we-are-headed">
                    <HeaderTitle
                        title="Where We're Headed"
                        // description="Xplooreze is more than a platform - it’s a movement. We’re building a community of educators and learners who believe in curiosity, connection, and lifelong growth."
                    />
                    <div className="card">
                        <img src="/academic-research.avif" />
                        <div className="content">
                            <HeaderTitle
                        title="Ready to explore learning differently?"
                        description="Xplooreze is more than a platform - it’s a movement. We’re building a community of educators and learners who believe in curiosity, connection, and lifelong growth."
                    />
                    <div className="cta-buttons">
                        <Link to='/authentication?authType=registration&userRole=student' className="primary-btn">Find a tutor</Link>
                        <Link to='/authentication?authType=registration&userRole=tutor' className="secondary-btn">Become a tutor</Link>
                    </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}