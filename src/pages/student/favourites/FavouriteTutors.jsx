import './FavouriteTutors.css';
import { useEffect, useState } from "react";
import { getFavorites } from "../../../data/modules/student-module";
import TutorCard from "../../../components/tutor-card/TutorCard";
import Loading from "../../../components/loading/Loading";
import { useNavigate } from 'react-router-dom';
    
export default function FavouriteTutors() {
    const [tutors, setTutors] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    async function fetchTutors() {
      try {
        setLoading(true);
        const { tutors: fetchedTutors, pagination } = await getFavorites();
        console.log(fetchedTutors);
        setTutors(fetchedTutors || []);
      } catch (error) {
        console.log('Error while receiving tutors', error);
        setTutors([]);
      } finally {
        setLoading(false);
      }
    }

    useEffect(() => {
      fetchTutors()
    }, []);

    if (loading) {
      return Loading();
    }

    // Add an icon and button for better engagement
if (tutors.length === 0) {
  return (
    <div className="favourite-tutors">
      <div className="content">
        <div className="empty-state">
          <svg className="empty-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h2>No favorite tutors yet</h2>
          <p>Start exploring tutors and add your favorites to keep track of the best ones!</p>
          <button className="primary-btn" onClick={() => navigate('/')}>
            Explore Tutors
          </button>
        </div>
      </div>
    </div>
  );
}


    return (
        <div className="favourite-tutors">
              <div className='tutors-list'>
                {tutors.map(tutor => (<div key={tutor._id} ><TutorCard tutor={tutor} /></div>))}
              </div>
        </div>
    );
};