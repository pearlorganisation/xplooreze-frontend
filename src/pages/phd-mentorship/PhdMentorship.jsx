import { Link } from "react-router-dom";
import { useState } from "react";
import { FiChevronRight, FiChevronDown } from "react-icons/fi";
import './PhdMentorship.css';
import HeaderTitle from "../../components/header-title/HeaderTitle";

export default function PhdMentorship() {
    const [activeIndex, setActiveIndex] = useState(null);
    const [activeResearchIndex, setActiveResearchIndex] = useState(null);

    const faqs = [
        {
            question: "How do I book a session with a senior professor?",
            answer: "You can book a session by clicking on the 'Book PhD Consultation' or 'Schedule Your Session' buttons which will guide you through the registration process."
        },
        {
            question: "What subjects or research areas do you cover?",
            answer: "Our expert mentors cover a wide range of disciplines including social sciences, natural sciences, engineering, humanities, and more. You can specify your area during registration."
        },
        {
            question: "Can I get help with data analysis software?",
            answer: "Yes, we provide support for both quantitative tools like SPSS, R, Python and qualitative tools like NVivo and thematic coding."
        },
        {
            question: "Is the mentorship only online?",
            answer: "Yes, all mentorship sessions are conducted online for your convenience, allowing you to access expert guidance anytime, anywhere."
        },
        {
            question: "What if I need help with academic writing and plagiarism checks?",
            answer: "Our team offers detailed feedback on academic writing, structure, clarity, and plagiarism checks to ensure your work meets global standards."
        }
    ];

    const researchSupports = [
        {
            question: "Literature Review Support",
            answer: "Make sense of complex readings, identify gaps, and build a coherent narrative that anchors your research."
        },
        {
            question: "Methodology Guidance",
            answer: "Refine your research design, framework, and approach with clarity and discipline-specific insight."
        },
        {
            question: "Data Analysis Help",
            answer: "Decode your data with expert support in both quantitative (SPSS, R, Python) and qualitative (NVivo, thematic coding) methods."
        },
        {
            question: "Academic Writing & Editing",
            answer: "Improve flow, structure, and clarity while ensuring your work remains plagiarism-free and aligned with global standards."
        },
        {
            question: "Plagiarism & Quality Checks",
            answer: "Get detailed feedback on originality, formatting, and academic tone — before submission."
        },
        {
            question: "Research Paper Support",
            answer: "From structuring your argument to refining citations and formatting, we help you prepare papers for conferences, journals, or internal review."
        },
        {
            question: "Referencing & Citation Guidance",
            answer: "Confused by APA, MLA, Chicago, or journal-specific formats? We help you cite with precision and confidence."
        },
        {
            question: "Journal Submission Prep",
            answer: "Get expert input on formatting, cover letters, and responding to reviewer comments — without losing your voice."
        }
    ];

    const toggleFAQ = (index) => {
        setActiveIndex(prevIndex => (prevIndex === index ? null : index));
    };

    const toggleResearch = (index) => {
        setActiveResearchIndex(prevIndex => (prevIndex === index ? null : index));
    };

    return (
        <div className="phd-mentorship">
            <header className="hero">
                <div className='header-content'>
                    <div className="hero-content">
                        <h1>Expert PhD Guidance & Coaching<br />Anytime<br />Anywhere</h1>
                        <div className="hero-image phone">
                            <video
                                autoPlay
                                muted
                                loop
                                playsInline
                                aria-hidden="true"
                                preload="auto"
                            >
                                <source src='/phd-mascot.mp4' type="video/mp4" />
                                {/* Fallback image if video unsupported */}
                            </video>
                        </div>
                        <p>
                            Get 1-to-1 online mentorship with senior professors and expert support to strengthen<br />your research, literature review, methodology, and data analysis.
                        </p>
                        <div className="cta-buttons">
                            <Link to='/consultation-form' className="primary-btn">Book PhD Consultation</Link>
                            <Link to='/research-form' className="secondary-btn">Explore Research Support</Link>
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
                            <source src='/phd-mascot.mp4' type="video/mp4" />
                            {/* Fallback image if video unsupported */}
                        </video>
                    </div>
                </div>
            </header>

            <div className="phd-section right">
                <img src="/phd-1.jpeg" className="founder-img desktop" alt="Founder Image" />
                <div className="about-founder-content">
                    <h1>Talk to Senior Professors. Solve Your Research Queries</h1>
                    {/* <img src="/founder.jpg" className="founder-img phone" alt="Founder Image" /> */}
                    <p>PhD journeys are challenging — but you don’t have to feel stuck. With Xplooreze PhD coaching, you can:</p>
                    <ul style={{ paddingLeft: 0, marginTop: 0, listStyleType: 'none' }}>
                        <li style={{ margin: '0 0 4px 0' }}>• Book personalized 1-to-1 consultations with senior professors</li>
                        <li style={{ margin: '0 0 4px 0' }}>• Get clear answers on methodology, thesis structure, or research design</li>
                        <li style={{ margin: '0 0 4px 0' }}>• Resolve doubts around literature review, data collection, or referencing</li>
                        <li style={{ margin: '0 0 4px 0' }}>• Gain practical, research-based feedback instead of generic advice</li>
                    </ul>
                    <div className="cta-buttons">
                        <Link to='/consultation-form' className="primary-btn">Schedule Your Session</Link>
                    </div>
                </div>
            </div>

            <div className="phd-section">
                <div className="about-founder-content">
                    <h1>Strengthen Your Thesis with Expert Research Support</h1>
                    {/* <img src="/phd.jpeg" className="founder-img phone" alt="PhD Image" /> */}
                    <p>Strong research is not just about ideas — it’s about clarity, structure, and academic standards. Our team helps PhD scholars with:</p>
                    <div className="research-faq-section">
                        {researchSupports.map((support, index) => (
                            <div
                                key={index}
                                className="faq-item"
                            >
                                <button
                                    className="faq-question"
                                    onClick={() => toggleResearch(index)}
                                    aria-expanded={activeResearchIndex === index}
                                    aria-controls={`research-answer-${index}`}
                                    id={`research-question-${index}`}
                                >
                                    {support.question}
                                    {activeResearchIndex === index ? <FiChevronDown /> : <FiChevronRight />}
                                </button>
                                {activeResearchIndex === index && (
                                    <div
                                        className="faq-answer"
                                        id={`research-answer-${index}`}
                                        role="region"
                                        aria-labelledby={`research-question-${index}`}
                                    >
                                        {support.answer}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <p>👉 Think of us as your PhD research partners — guiding you step by step while you stay in control of your work.</p>
                    <div className="cta-buttons">
                        <Link to='/research-form' className="primary-btn">Request Research Guidance</Link>
                    </div>
                </div>
                <img src="/vertical-girl.jpg" className="founder-img desktop right" alt="Research Support Image" />
            </div>

            <div className="phd-section right">
                <img src="/phd-3.jpeg" className="founder-img desktop" alt="Why Choose Image" />
                <div className="about-founder-content">
                    <h1>Why Choose Xplooreze for PhD Coaching?</h1>
                    <p>From proposal to publication, we walk beside you with ethical, confidential, and personalized support — led by senior professors who understand what excellence truly demands.</p>
                    <ul style={{ paddingLeft: 0, marginTop: 0, listStyleType: 'none' }}>
                        <li style={{ margin: '0 0 4px 0' }}>• 15+ years of experience in PhD mentorship & academic writing</li>
                        <li style={{ margin: '0 0 4px 0' }}>• Senior professors and subject experts across disciplines</li>
                        <li style={{ margin: '0 0 4px 0' }}>• International exposure — students from India, Singapore & US universities</li>
                        <li style={{ margin: '0 0 4px 0' }}>• Ethical, confidential & personalized PhD guidance</li>
                        <li style={{ margin: '0 0 4px 0' }}>• Final output aligned to global academic expectations</li>
                    </ul>
                </div>
            </div>

            <div className="phd-section">
                <div className="about-founder-content right">
                    <h1>How Our PhD Support Works</h1>
                    <p>We’ve simplified the PhD journey so you can focus on what truly matters — your research.<br />Every stage, every question, guided with ease and clarity..</p>
                    <ul style={{ listStyleType: 'none', paddingLeft: 0, marginTop: 0 }}>
                        <li style={{ margin: '0 0 8px 0' }}>1️⃣ &nbsp;&nbsp;Share your research challenge or requirement</li>
                        <li style={{ margin: '0 0 8px 0' }}>2️⃣ &nbsp;&nbsp;Get matched with the right professor or research mentor</li>
                        <li style={{ margin: '0 0 8px 0' }}>3️⃣ &nbsp;&nbsp;Choose between 1-to-1 coaching sessions or structured support packages</li>
                        <li style={{ margin: '0 0 8px 0' }}>4️⃣ &nbsp;&nbsp;Move ahead with confidence, clarity, and stronger results</li>
                    </ul>
                </div>
                <img src="/phd-4.jpeg" className="founder-img desktop right" alt="How It Works Image" />
            </div>

            <div className="where-we-are-headed">
                <HeaderTitle
                    title="Simplify Your PhD Journey"
                // description="Xplooreze is more than a platform - it’s a movement. We’re building a community of educators and learners who believe in curiosity, connection, and lifelong growth."
                />
                <div className="card">
                    <img src="/phd-5.jpeg" />
                    <div className="content">
                        <HeaderTitle
                            title="PhD Guidance That Makes Research Easier"
                            description="Your PhD journey doesn’t have to feel overwhelming. Whether it’s one conversation with a professor or full guidance for literature review, data analysis, or thesis refinement — Xplooreze provides trusted online PhD coaching and research support."
                        />
                        <div className="cta-buttons">
                            <Link to='/consultation-form' className="primary-btn">Book PhD Consultation</Link>
                            <Link to='/research-form' className="secondary-btn">Research Support</Link>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="faq-section">
                <h2 className="faq-title">❓ Frequently Asked Questions</h2>
                {faqs.map((faq, index) => (
                    <div
                        key={index}
                        className="faq-item"
                    >
                        <button
                            className="faq-question"
                            onClick={() => toggleFAQ(index)}
                            aria-expanded={activeIndex === index}
                            aria-controls={`faq-answer-${index}`}
                            id={`faq-question-${index}`}
                        >
                            {faq.question}
                            {activeIndex === index ? <FiChevronDown /> : <FiChevronRight />}
                        </button>
                        {activeIndex === index && (
                            <div
                                className="faq-answer"
                                id={`faq-answer-${index}`}
                                role="region"
                                aria-labelledby={`faq-question-${index}`}
                            >
                                {faq.answer}
                            </div>
                        )}
                    </div>
                ))}
            </div>

        </div>
    );
}