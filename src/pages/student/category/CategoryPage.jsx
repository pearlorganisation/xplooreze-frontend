import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaChevronRight,
  FaUniversity,
  FaLanguage,
  FaFlask,
  FaCode,
  FaMusic,
  FaPalette,
  FaRunning,
  FaBriefcase,
  FaLightbulb,
  FaEdit,
} from "react-icons/fa";
import { getCategories } from "../../../data/modules/dynamic-module";
import Loading from "../../../components/loading/Loading";
import "./CategoryFilter.css";

// Shared Icon Helper (You can move this to a separate utils file)
export const getIcon = (name) => {
  const icons = {
    Academics: <FaUniversity />,
    Languages: <FaLanguage />,
    Coding: <FaCode />,
    Music: <FaMusic />,
    Arts: <FaPalette />,
    Fitness: <FaRunning />,
    "Professional Skills": <FaBriefcase />,
    "Tech & Innovation": <FaLightbulb />,
    Hobbies: <FaEdit />,
    "Test Prep": <FaFlask />,
    "Life Skills": <FaLanguage />,
  };
  return icons[name] || <FaUniversity />;
};

const CategoryPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchCats() {
      setLoading(true);
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchCats();
  }, []);

  if (loading)
    return (
      <div className="filter-loading">
        <Loading />
      </div>
    );

  return (
    <div className="category-filter-container">
      <div className="category-section">
        <h2 className="main-title">What would you like to learn?</h2>
        <div className="category-grid">
          {categories.map((cat) => (
            <div
              key={cat}
              className="category-card"
              onClick={() => navigate(`/categories/${encodeURIComponent(cat)}`)}
            >
              <div className="category-info">
                <span className="category-icon">{getIcon(cat)}</span>
                <div className="category-text">
                  <h3>{cat}</h3>
                  <p>Explore expert mentors</p>
                </div>
              </div>
              <FaChevronRight className="arrow-icon" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;
