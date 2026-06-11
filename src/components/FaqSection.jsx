import React, { useState } from "react";

const faqData = [
  {
    question: "How can I find the best CBSE maths tutor in Bangalore?",
    answer:
      "Xplooreze helps students connect with experienced CBSE maths tutors in Bangalore for personalized learning, concept clarity, homework support, and board exam preparation.",
  },
  {
    question: "Can I find a science tutor for Class 10 near me in Bangalore?",
    answer:
      "Yes, Xplooreze provides experienced science tutors for Class 10 near you in Bangalore, covering Physics, Chemistry, and Biology with board-focused preparation and doubt-solving sessions.",
  },
  {
    question:
      "Does Xplooreze offer tuition classes in Bangalore for Class 10 students?",
    answer:
      "Yes, Xplooreze offers online and personalized tuition classes in Bangalore for Class 10 students across CBSE, ICSE, and State Board curriculums.",
  },
  {
    question:
      "Who is the best maths tutor in Bangalore for CBSE board exam preparation?",
    answer:
      "Xplooreze connects students with some of the best maths tutors in Bangalore for CBSE board exam preparation, helping students improve problem-solving skills and exam performance.",
  },
  {
    question:
      "Are online maths tutors available in Bangalore for K-12 students?",
    answer:
      "Yes, Xplooreze provides online maths tutors in Bangalore for K-12 students with flexible schedules, interactive learning methods, and personalized attention.",
  },
  {
    question: "Can I hire a private tutor for science in Bangalore?",
    answer:
      "Yes, students can easily find a private tutor for science in Bangalore through Xplooreze for focused learning, exam preparation, and concept-based teaching.",
  },
  {
    question:
      "Do you provide one-on-one maths tuition in Bangalore for CBSE and ICSE students?",
    answer:
      "Yes, Xplooreze offers one-on-one maths tuition in Bangalore for both CBSE and ICSE students to ensure better understanding, individual attention, and academic improvement.",
  },
  {
    question:
      "Are experienced science tutors available for Class 10 Bangalore board exam preparation?",
    answer:
      "Yes, Xplooreze has experienced science tutors for Class 10 Bangalore board exam preparation who help students with revision, sample papers, practical concepts, and exam strategies.",
  },
  {
    question: "How can I find a local maths tutor near me in Bangalore?",
    answer:
      "You can easily search for a local maths tutor near you in Bangalore on Xplooreze using filters like class, subject, tutor expertise, and preferred learning mode.",
  },
  {
    question: "What are the maths and science tutor fees in Bangalore?",
    answer:
      "Maths and science tutor fees in Bangalore vary based on class level, subject complexity, tutor experience, and session type. Xplooreze offers flexible tuition options suitable for different budgets.",
  },
];

const FaqSection = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section className="faq-section">
      <div className="faq-container">
        <h2 className="faq-title">
          FAQ – Xplooreze Online Tutoring in Bangalore
        </h2>

        {faqData.map((faq, index) => (
          <div className="faq-item" key={index}>
            <button
              className="faq-question"
              onClick={() => toggleAccordion(index)}
            >
              <span>{faq.question}</span>
              <span>{activeIndex === index ? "−" : "+"}</span>
            </button>

            {activeIndex === index && (
              <div className="faq-answer">
                <p>{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default FaqSection;
