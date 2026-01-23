import './Footer.css';
import { APP_NAME, CONTACT_DETAILS } from '../../data/config';

function Footer() {
    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-section about">
                    {/* <h2 className="footer-title">{APP_NAME}</h2> */}
                    <img src='/app-logo-oval.png' />
                    <p>Connecting talent with opportunity.</p>
                    <div className="socials">
                        <a href={CONTACT_DETAILS.facebook} target='_blank'><i className="fab fa-facebook"></i></a>
                        <a href={CONTACT_DETAILS.linkedin} target='_blank'><i className="fab fa-linkedin"></i></a>
                        <a href={CONTACT_DETAILS.instagram} target='_blank'><i className="fab fa-instagram"></i></a>
                    </div>
                </div>
                <div className="footer-section links">
                    <h2 className="footer-title">Quick Links</h2>
                    <ul>
                        <li><a href="/">Home</a></li>
                        <li><a href="/about-us">About Us</a></li>
                        <li><a href="/privacy-policy">Privacy Policy</a></li>
                        <li><a href="/terms-and-conditions">Terms & Conditions</a></li>
                        <li><a href="/shipping-policy">Shipping Policy</a></li>
                        <li><a href="/cancellation-refund">Cancellation & Refund</a></li>
                        {/* <li><a href="#">PhD Assistance</a></li>
                        <li><a href="#">Research Paper</a></li> */}
                    </ul>
                </div>
                <div className="footer-section contact">
                    <h2 className="footer-title">Contact</h2>
                    <ul>
                        <li><i className="fas fa-envelope"></i> {CONTACT_DETAILS.official_email}</li>
                        <li><i className="fas fa-phone"></i> +91 {CONTACT_DETAILS.phone}</li>
                        <li><i className="fab fa-whatsapp"></i> +91 {CONTACT_DETAILS.whatsapp}</li>
                        <li><i className="fas fa-map-marker-alt"></i> {CONTACT_DETAILS.address}</li>
                    </ul>
                </div>
            </div>
            <div className="footer-bottom">
                <p>© {new Date().getFullYear().toString()} {APP_NAME}. All Rights Reserved.</p>
                <p>Created with <span className="heart">❤</span> by <a href="https://statefulcoders.com">statefulcoders</a></p>
            </div>
        </footer>
    );
}

export default Footer;