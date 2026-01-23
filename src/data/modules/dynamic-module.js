import api from "../axios";

export async function getCategories() {
    try {
        const response = await api.get('/categories');
        return response.data.data;
    } catch (_) {
        return [];
    }
}

export async function getSubCategories({ category }) {
    try {
        const response = await api.get(`/categories/${category}/subcategories`);
        return response.data.data;
    } catch (_) {
        return [];
    }
}

export async function getPrivacy() {
    return `
        <p>At Xplooreze, we are committed to protecting the privacy of our users. This Privacy Policy outlines the types of personal information we collect, how we use it, and the measures we take to safeguard it when you visit our website <a href="https://www.xplooreze.in">www.xplooreze.in</a>.</p>
        
        <h2>Information We Collect:</h2>
        <ul>
            <li><strong>Personal Information:</strong> We may collect personal information, such as your name, email address, phone number, or postal address, when you voluntarily provide it to us through forms on our website.</li>
        </ul>

        <h2>Use of Information:</h2>
        <ul>
            <li>We use the information we collect to provide and improve our services, communicate with you, personalize your experience, and comply with legal obligations.</li>
            <li>We do not sell, rent, or trade your personal information to third parties.</li>
        </ul>

        <h2>Data Security:</h2>
        <p>We implement appropriate technical and organizational measures to protect the security of your personal information against unauthorized access, disclosure, alteration, or destruction.</p>

        <h2>Your Choices:</h2>
        <p>You can choose to opt-out of certain data collection and processing activities by adjusting your browser settings or contacting us directly.</p>

        <h2>Changes to This Privacy Policy:</h2>
        <p>We reserve the right to update or modify this Privacy Policy at any time. Any changes will be effective immediately upon posting the updated Privacy Policy on our website.</p>

        <h2>Contact Us:</h2>
        <p>If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at <a href="mailto:xplooreze@gmail.com">xplooreze@gmail.com</a>.</p>

        <p>By using our website, you consent to the collection and use of your information as outlined in this Privacy Policy.</p>
    `.trim();
}

export async function getTerms() {
    return `
        <h2>Tutor Undertaking & Terms of Engagement</h2>
        <p>Welcome to Xplooreze! By accessing or using our website <a href="https://www.xplooreze.in">www.xplooreze.in</a>, you agree to comply with and be bound by these Terms and Conditions. Please read them carefully before using our services.</p>

        <h3>1. Platform-Exclusive Engagements</h3>
        <p>All teaching, mentoring, coaching or related sessions with students discovered through Xplooreze will be conducted only via the platform.</p>
        <p>I will not solicit or accept direct contact information, payments, or engage in sessions outside the platform without Xplooreze’s prior written consent.</p>
        <p>In case of violation, Xplooreze may withhold pending payouts, suspend or permanently terminate my account.</p>

        <h3>2. Payments & Fees</h3>
        <p>I will receive payments for my services exclusively through the Xplooreze payment system.</p>
        <p>I will not request, accept, or process payments by cash, bank transfer, or any other off-platform means from students or their parents/guardians.</p>

        <h3>3. Confidentiality & Data Protection</h3>
        <p>I will not misuse or share students’ personal data, contact details, or any information obtained through the platform for purposes outside of agreed sessions.</p>
        <p>I will maintain confidentiality of all materials, lesson content, and communications.</p>

        <h3>4. Professional Conduct</h3>
        <p>I will provide high-quality, ethical, and respectful tutoring services.</p>
        <p>I will comply with applicable laws, including child protection and online safety guidelines.</p>
        <p>I will not upload or share content that infringes any copyright, trademark, or intellectual property rights.</p>

        <h3>5. Cancellations & Disputes</h3>
        <p>I will follow the platform’s cancellation, rescheduling, and refund policies.</p>
        <p>In case of disputes with a student, I will cooperate with Xplooreze’s support team to resolve them.</p>

        <h3>6. Platform Rights</h3>
        <p>Xplooreze reserves the right to withhold pending payments, suspend, or permanently terminate my account for any breach of these terms or other platform policies.</p>
        <p>Xplooreze may update these terms from time to time; continued use of the platform constitutes acceptance of the updated terms.</p>

        <h3>Use of Our Services:</h3>
        <ul>
            <li>You agree to use our website only for lawful purposes and in a way that does not infringe the rights of others.</li>
            <li>You must not engage in activities that could harm, disable, or overburden our website or interfere with anyone else’s use.</li>
        </ul>

        <h3>Account Responsibilities:</h3>
        <ul>
            <li>If you create an account, you are responsible for maintaining the confidentiality of your login information.</li>
            <li>You agree to notify us immediately if you suspect any unauthorized use of your account.</li>
        </ul>

        <h3>Intellectual Property:</h3>
        <p>All content, trademarks, logos, and materials on this site are owned by Xplooreze or licensed to us.</p>
        <p>You may not copy, reproduce, or distribute our content without prior written permission.</p>

        <h3>Limitation of Liability:</h3>
        <p>We make every effort to keep the website running smoothly, but we are not liable for any temporary unavailability or any loss or damage resulting from the use of our site or services.</p>

        <h3>Governing Law:</h3>
        <p>These Terms and Conditions are governed by and construed in accordance with the laws of India.</p>

        <h3>Contact Us:</h3>
        <p>If you have any questions about these Terms and Conditions, please reach out to us at <a href="mailto:xplooreze@gmail.com">xplooreze@gmail.com</a>.</p>

        <p>By continuing to use our website, you acknowledge that you have read, understood, and agreed to these Terms and Conditions.</p>
    `.trim();
}

export async function getCancellationRefundPolicy() {
    return `
        <h2>Xplooreze — Cancellation & Refund Policy</h2>
        <p><strong>Effective Date:</strong> 13 October 2025</p>

        <h3>Overview</h3>
        <p>At Xplooreze, we connect students and tutors through our online platform to make quality learning more accessible. To maintain fairness for tutors and ensure commitment from students, we do not offer refunds for cancellations. However, learners may reschedule sessions within the permitted time frame.</p>

        <h3>1. Scope</h3>
        <p>This policy applies to all tutoring sessions, subscription plans, workshops, and educational services booked through <a href="https://xplooreze.in">xplooreze.in</a>.</p>

        <h3>2. Definitions</h3>
        <ul>
            <li><strong>Session Date:</strong> The confirmed date and time for a scheduled tutoring session.</li>
            <li><strong>Student:</strong> The individual who books a session.</li>
            <li><strong>Tutor:</strong> The individual offering tutoring services via Xplooreze.</li>
            <li><strong>Transaction Fees:</strong> Non-refundable charges imposed by payment gateways or banks.</li>
        </ul>

        <h3>3. Student Cancellations</h3>
        <ul>
            <li>Once a session or course is booked, no refund will be issued for any cancellation.</li>
            <li>Students can request to reschedule their session at least 12 hours before the scheduled start time.</li>
            <li>Rescheduling is allowed once per session without additional charge.</li>
            <li>Cancellations made within 12 hours of the scheduled start time or no-shows are considered forfeited with no reschedule or refund.</li>
        </ul>

        <h3>4. Tutor Cancellations</h3>
        <ul>
            <li>Tutors must provide at least 24 hours’ notice if they need to cancel or reschedule a session.</li>
            <li>If a tutor cancels, students will be offered a free reschedule with the same or another tutor.</li>
            <li>Tutors with repeated cancellations may be reviewed or suspended from the platform.</li>
        </ul>

        <h3>5. Technical or Platform Issues</h3>
        <ul>
            <li>If a session is disrupted due to verified technical issues on Xplooreze’s side, a free reschedule will be arranged.</li>
            <li>If the issue is from the student or tutor’s side (e.g., poor internet), the case will be evaluated individually. Proof (screenshots, logs) may be requested.</li>
        </ul>

        <h3>6. Subscriptions & Packages</h3>
        <ul>
            <li>Subscription and package payments are non-refundable once purchased.</li>
            <li>Students may reschedule upcoming sessions within the active subscription period, subject to tutor availability.</li>
            <li>Unused sessions expire at the end of the subscription term and cannot be carried forward or refunded.</li>
        </ul>

        <h3>7. Group Classes / Workshops</h3>
        <ul>
            <li>Payments for group sessions or workshops are non-refundable.</li>
            <li>Participants unable to attend may request to join a future batch of the same workshop if available.</li>
        </ul>

        <h3>8. Dispute Resolution</h3>
        <p>If a student is dissatisfied with a session, they may report it to <a href="mailto:hello.xplooreze@gmail.com">hello.xplooreze@gmail.com</a> within 48 hours. The Xplooreze team will mediate between both parties and may offer a make-up session if the issue is found valid. Refunds are not issued under any circumstances.</p>

        <h3>9. Exceptions</h3>
        <p>Coupons, discounts, and promotional credits are non-transferable and non-refundable.</p>

        <h3>10. Policy Updates</h3>
        <p>Xplooreze may revise this policy periodically. The latest version will always be available at <a href="https://xplooreze.in/cancellation-refund">https://xplooreze.in/cancellation-refund</a>.</p>

        <h3>Contact Us:</h3>
        <p>For rescheduling or technical support:</p>
        <ul>
            <li>📧 <a href="mailto:hello.xplooreze@gmail.com">hello.xplooreze@gmail.com</a></li>
            <li>🌐 <a href="https://xplooreze.in">https://xplooreze.in</a></li>
        </ul>

        <p><strong>Xplooreze — Where every session counts. Reschedule, don’t cancel.</strong></p>
    `.trim();
}

export async function getShippingPolicy() {
    return `
        <h2>Shipping Policy – Xplooreze.in</h2>
        <p><strong>Last Updated:</strong> October 2025</p>

        <p>At Xplooreze.in, we are a digital education platform connecting students with qualified tutors for online and offline sessions. Since all our products and services are delivered digitally or facilitated through our online platform, no physical shipping is involved.</p>

        <h3>1. Service Delivery</h3>
        <ul>
            <li>Once a student enrolls or books a session through our platform, details of the assigned tutor and session schedule are shared via email or WhatsApp within 24–48 hours.</li>
            <li>For online sessions, meeting links or platform access details are shared before the class begins.</li>
            <li>For home tutoring (if applicable), the tutor will contact the student directly to confirm timing and address details.</li>
        </ul>

        <h3>2. Digital Course Material</h3>
        <ul>
            <li>Any study materials, notes, or resources provided as part of your course are delivered electronically through email, WhatsApp, or the Xplooreze Learning Portal.</li>
            <li>There are no physical shipments associated with our products or services.</li>
        </ul>

        <h3>3. Estimated Delivery Time</h3>
        <ul>
            <li>For online courses and classes, access is usually granted within 24–48 hours of successful payment confirmation.</li>
            <li>For personalized tutor matching services, tutor details are typically shared within 3–5 business days.</li>
        </ul>

        <h3>4. Contact</h3>
        <p>If you have questions regarding your class access, tutor assignment, or study material delivery, please contact us:</p>
        <ul>
            <li>📧 Email: <a href="mailto:hello.xplooreze@gmail.com">hello.xplooreze@gmail.com</a></li>
            <li>📞 Phone/WhatsApp: +91-9945693172</li>
            <li>🌐 Website: <a href="https://www.xplooreze.in">www.xplooreze.in</a></li>
        </ul>

        <p><strong>Note:</strong> Xplooreze is a digital service platform; hence, this policy serves as a formal declaration that no physical goods are shipped as part of our offerings.</p>
    `.trim();
}