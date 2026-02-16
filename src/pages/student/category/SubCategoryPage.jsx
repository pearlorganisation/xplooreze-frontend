import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaChevronRight } from "react-icons/fa";
import { getSubCategories } from "../../../data/modules/dynamic-module";
import { getIcon } from "./CategoryPage";
import Loading from "../../../components/loading/Loading";

const SubCategoryPage = () => {
  const { categoryName } = useParams();
  const navigate = useNavigate();
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchSubs() {
      setLoading(true);
      try {
        const subs = await getSubCategories({ category: categoryName });
        setSubCategories(subs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchSubs();
  }, [categoryName]);

  const handleSubSelect = (sub) => {
    const cat = categoryName.toLowerCase().replace(/\s+/g, "-");
    const subject = sub.toLowerCase().replace(/\s+/g, "-");

    const mode = "online-tutoring";

    navigate(`/${cat}/${mode}/${subject}`);
  };

  if (loading)
    return (
      <div className="filter-loading-full">
        <Loading />
      </div>
    );

  return (
    <div className="category-page-container">
      {/* Animated Background Blobs */}
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>
      <div className="bg-blob blob-3"></div>

      <div className="subcategory-wrapper">
        <header className="subcategory-header">
          {/* <button className="back-btn-minimal" onClick={() => navigate(-1)}>
            <FaArrowLeft /> <span>Back</span>
          </button> */}

          <div className="title-area">
            <div className="category-badge-animated">
              {getIcon(categoryName)} {categoryName}
            </div>
            <h3 className="hero-text">
              Find your ideal <span>{categoryName}</span> tutor
            </h3>
            <p className="sub-text">
              Select a specialized subject to view expert tutors tailored for
              your needs.
            </p>
          </div>
        </header>

        <div className="subcategory-grid-modern">
          {subCategories.map((sub, index) => (
            <button
              key={sub}
              style={{ "--delay": `${index * 0.06}s` }}
              className="subcategory-chip-modern"
              onClick={() => handleSubSelect(sub)}
            >
              <span className="chip-content">
                <span className="chip-text">{sub}</span>
                <FaChevronRight className="chip-arrow" />
              </span>
              <div className="chip-hover-bg"></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubCategoryPage;
