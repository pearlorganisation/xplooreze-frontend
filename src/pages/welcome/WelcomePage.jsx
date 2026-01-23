import { useEffect, useState, useRef } from 'react';
import './WelcomePage.css';
import BlogCard from '../../components/blog/BlogCard';
import HeaderTitle from '../../components/header-title/HeaderTitle';
import { getBlogs } from '../../data/modules/blog-module';
import { Link, useNavigate } from 'react-router-dom';
import { FaArrowRight, FaChalkboardTeacher, FaGraduationCap, FaHome, FaLaptop, FaListUl, FaUser, FaWhatsapp, FaChevronDown } from 'react-icons/fa';

function WelcomePage() {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const toggleDropdown = () => {
    setShowDropdown(prev => !prev);
  };

  const handleMouseEnter = () => {
    if (isDesktop) {
      setShowDropdown(true);
    }
  };

  const handleMouseLeave = () => {
    if (isDesktop) {
      setShowDropdown(false);
    }
  };

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const { data } = await getBlogs({ page: 1, limit: 4 });
        setBlogs(data || []);
      } catch (error) {
        console.log('Something went wrong while retrieving blogs:', error);
      }
    }
    fetchBlogs();
  }, []);

  return (
    <div className='welcome-root welcome-page'>
      <FaWhatsapp
        className='whatsapp-button'
        onClick={() => {
          let message = `Hi!
Welcome to Xplooreze – India’s platform for skill-based learning & mentoring.
We’re thrilled to have you here!
Choose how you’d like to join:
Join as a Tutor/Mentor – Share your expertise & earn while teaching: https://www.xplooreze.in/authentication?authType=registration&userRole=tutor
Join as a Learner – Find the right tutor & start your learning journey: https://www.xplooreze.in/authentication?authType=registration&userRole=student
If you have any questions or need help with the form, just reply to this message—we’re here to support you.
Let’s grow & learn together!
Team Xplooreze
`;
          window.open(`https://wa.me/919945693172?text=${encodeURIComponent(message)}`, "_blank");
        }}
      />
      <header className="hero">
        <div className='header-content'>
          <div className="hero-content">
            <h1>Learn Anything.<br />Anywhere.<br />Anytime.</h1>
            <div className="hero-image phone">
              <video
                autoPlay
                muted
                loop
                playsInline
                aria-hidden="true"
                preload="auto"
              >
                <source src='/header-animation.mp4' type="video/mp4" />
                {/* Fallback image if video unsupported */}
              </video>
              {/* <img src="/girl-ind.png" alt="Girl Illustration" /> */}
            </div>
            <p>
              Find your ideal tutor with Xplooreze verified subject experts,<br />tailored lessons, and flexible learning designed to help you achieve your goal faster.
            </p>
            <div className="cta-buttons">
              <div 
                className="welcome-page-primary-dropdown" 
                ref={dropdownRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <button 
                  className="welcome-page-primary-btn" 
                  onClick={!isDesktop ? toggleDropdown : undefined}
                >
                  Find your tutor
                  <FaChevronDown />
                </button>
                {showDropdown && (
                  <div className="welcome-page-dropdown-menu">
                    <Link 
                      to='/authentication?authType=registration&userRole=student&tutoringMode=Home%20Tutoring' 
                      className="welcome-page-dropdown-item" 
                      onClick={() => setShowDropdown(false)}
                    >
                      Home Tutoring
                    </Link>
                    <Link 
                      to='/authentication?authType=registration&userRole=student&tutoringMode=Online%20Tutoring' 
                      className="welcome-page-dropdown-item" 
                      onClick={() => setShowDropdown(false)}
                    >
                      Online Tutoring
                    </Link>
                  </div>
                )}
              </div>
              <button 
                className="welcome-page-secondary-btn"
                onClick={() => {
                  const element = document.getElementById('tutor-registration');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                Join as tutor
              </button>
            </div>
          </div>
          <div className="hero-image other">
            <video
              autoPlay
              muted
              loop
              playsInline
              aria-hidden="true"
              preload="auto"
            >
              <source src='/header-animation.mp4' type="video/mp4" />
              {/* Fallback image if video unsupported */}
            </video>
            {/* <img src="/girl-ind.png" alt="Girl Illustration" /> */}
          </div>
        </div>
      </header>
      <div className='welcome-content'>
        <div className='content-section services'>
          <HeaderTitle
            title="How We Help You Learn"
            description="Xplooreze connects passionate educators with curious minds, offering long-term support and opportunities for growth." />
          <div className='services-items'>
            <div
              className='service-item'
            >
              <FaHome className='icon' />
              <h1>Home Tutoring</h1>
              <h3>Trusted home tutors for personalised one-on-one learning. Boost grades and confidence with safe, interactive lessons at your doorstep.</h3>
              <img src='/online-tutoring.avif' />
              <button onClick={() =>
                navigate('/authentication?authType=registration&userRole=student&tutoringMode=Home%20Tutoring')
              } className='welcome-section-button'>Learn at Home →</button>
            </div>
            <div
              className='service-item'
            >
              <FaLaptop className='icon' />
              <h1>Online Tutoring</h1>
              <h3>Learn from expert online tutors anywhere in India. Flexible live classes for school subjects, test preparation and skill development</h3>
              <img src='/academic-research.avif' />
              <button onClick={() =>
                navigate('/authentication?authType=registration&userRole=student&tutoringMode=Online%20Tutoring')
              } className='welcome-section-button'>Live Online Classes →</button>
            </div>
            <div className='service-item'>
              <FaGraduationCap className='icon' />
              <h1>PhD Mentorship</h1>
              <h3>Book 1-on-1 calls with experienced professors for complete PhD research support from topic selection to thesis completion and publication.</h3>
              <img src='/content-writing.avif' />
              <button onClick={() => navigate('/phd-mentorship')} className='welcome-section-button'>1-on-1 PhD Help →</button>
            </div>
          </div>
        </div>
        <div className='content-section'>
          <div className='how-we-work-card'>
            <HeaderTitle title='How We Work' description='Find the perfect tutor for home or online classes in simple 4 steps' />
            <div className='how-we-work-steps'>
              <div className='how-we-work-step'>
                <FaHome className='step-icon' />
                <h1>Share Your Need</h1>
                <p>Select subject, grade, pincode (for home) or "online" (for virtual). Choose your timing.</p>
              </div>
              <div className='how-we-work-step'>
                <FaUser className='step-icon' />
                <h1>We Match You</h1>
                <p>Get instant matches with verified tutors in your area or across India online.</p>
              </div>
              <div className='how-we-work-step'>
                <FaListUl className='step-icon' />
                <h1>Compare & Shortlist</h1>
                <p>Check profiles, ratings and fees. Shortlist your favourites.</p>
              </div>
              <div className='how-we-work-step'>
                <FaChalkboardTeacher className='step-icon' />
                <h1>Book & Start Learning</h1>
                <p>Book a demo or start classes. Pay securely through UPI/Razorpay.</p>
              </div>
            </div>
          </div>
        </div>
        <div className='content-section' id="tutor-registration">
          <div className='tutor-card'>
            <video
              autoPlay
              muted
              loop
              playsInline
              aria-hidden="true"
              preload="auto"
            >
              <source src='/tutor-card-animation.mp4' type="video/mp4" />
              {/* Fallback image if video unsupported */}
            </video>
            <div className='tutor-card-content'>
              <h1>
                Register as tutor
              </h1>
              <p>Share your knowledge with learners around the world. Whether you're a skilled educator or simply passionate about teaching, our platform makes it easy to connect with students and start tutoring.</p>
              <ul>
                <li>Turn your passion into purpose.</li>
                <li>Teach what you love, when you want.</li>
                <li>Reach learners across the globe.</li>
              </ul>
              <Link to='/authentication?authType=registration&userRole=tutor' className="tutor-reg-btn">Become a tutor<FaArrowRight className='arrow-icon' /></Link>
            </div>
          </div>
        </div>
        <div className='content-section testimonials'>
          <HeaderTitle
            title="Testimonials"
            description="Read what our satisfied customers have to say about our service." />
          <div className='testimonials-items'>
            <div className='testimonial-item'>
              <div className='testimonial-tile'>
                <img src='/testimonial-f0.avif' />
                <h3>Anshu Priya</h3>
                <div className="stars">
                  <span>&#9733;</span>
                  <span>&#9733;</span>
                  <span>&#9733;</span>
                  <span>&#9733;</span>
                  <span>&#9733;</span>
                </div>
              </div>
              <p>"I struggled to meet deadlines for my dissertation, but Xplooreze helped me find credible sources, develop a strong research question, and organize my findings. Their communication was excellent, and they were always available to answer questions. Highly recommend!"</p>
            </div>
            <div className='testimonial-item'>
              <div className='testimonial-tile'>
                <img src='/testimonial-m0.jpg' />
                <h3>Karan</h3>
                <div className="stars">
                  <span>&#9733;</span>
                  <span>&#9733;</span>
                  <span>&#9733;</span>
                  <span>&#9733;</span>
                  <span>&#9733;</span>
                </div>
              </div>
              <p>"Working with Xplooreze was amazing. They provided in-depth, unbiased research support on a complex topic, and their expertise helped my proposal get accepted in one go. Truly impressed by their professionalism."</p>
            </div>
            <div className='testimonial-item'>
              <div className='testimonial-tile'>
                <img src='/testimonial-f0.avif' />
                <h3>Kajal Rawat</h3>
                <div className="stars">
                  <span>&#9733;</span>
                  <span>&#9733;</span>
                  <span>&#9733;</span>
                  <span>&#9733;</span>
                  <span>&#9733;</span>
                </div>
              </div>
              <p>"Extremely satisfied with Xplooreze. They helped edit my dissertation, analyze data, and improve my writing. Their support was thorough, professional, and made the process smooth and stress-free."</p>
            </div>
            <div className='testimonial-item'>
              <div className='testimonial-tile'>
                <img src='/testimonial-m0.jpg' />
                <h3>Krishna Rajput</h3>
                <div className="stars">
                  <span>&#9733;</span>
                  <span>&#9733;</span>
                  <span>&#9733;</span>
                  <span>&#9733;</span>
                  <span>&#9733;</span>
                </div>
              </div>
              <p>"Xplooreze provided quality research materials and helped refine my methodology and writing style. Their detailed feedback on drafts was invaluable. I’m grateful for their guidance and support throughout."</p>
            </div>
          </div>
        </div>
        <div className='content-section meet-the-founder'>
          <h1>Meet The<br />Founder</h1>
          <img src='/founder.jpg' />
          <p>Hi, I’m Dr. Ruchi Jain. After mentoring business students across the world and working with top U.S.-based ed-tech platforms for 17 years, I saw how hard it was for families to find trusted tutors nearby.<br />That’s why I created Xplooreze—to make quality tutoring accessible, personal, and safe.<br /><a href='/about-us'>Read the full story →</a></p>
        </div>
        <div className='content-section blogs'>
          <HeaderTitle
            title="Recent Blogs" />
          <div className='blogs-items'>
            {blogs.map(item => (
              <div key={item.title}>
                <BlogCard blogModel={item} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default WelcomePage;