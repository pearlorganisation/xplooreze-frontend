import React, { useState, useEffect } from "react";
import {
  getCategories,
  getSubCategories,
} from "../../../data/modules/dynamic-module";
import MultiSelect from "../../../components/multiselect/MultiSelect";

const CategoryFilter = ({ selectedSubjects, onSubjectsChange }) => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [subCategories, setSubCategories] = useState([]);
  const [isLoadingSubs, setIsLoadingSubs] = useState(false);

  // Fetch all categories on mount
  useEffect(() => {
    async function fetchMainCategories() {
      try {
        const cats = await getCategories();
        setCategories(cats);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    }
    fetchMainCategories();
  }, []);

  // Fetch sub-categories whenever the main category changes
  useEffect(() => {
    async function fetchSubs() {
      if (!selectedCategory) {
        setSubCategories([]);
        return;
      }
      setIsLoadingSubs(true);
      try {
        const subs = await getSubCategories({ category: selectedCategory });
        setSubCategories(subs);
      } catch (error) {
        console.error("Error fetching sub-categories:", error);
      } finally {
        setIsLoadingSubs(false);
      }
    }
    fetchSubs();
  }, [selectedCategory]);

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    // Optional: Clear subjects when category changes
    // onSubjectsChange([]);
  };

  return (
    <div
      className="category-filter-container"
      style={{ display: "flex", gap: "10px", flexWrap: "wrap", width: "100%" }}
    >
      {/* Main Category Dropdown */}
      <div className="filter-group">
        <select
          value={selectedCategory}
          onChange={handleCategoryChange}
          className="category-select"
          style={{
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            minWidth: "150px",
          }}
        >
          <option value="">Select Category</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Sub Category MultiSelect (Visible only when category is selected) */}
      <div className="filter-group" style={{ flex: 1, minWidth: "200px" }}>
        <MultiSelect
          name="subjects"
          placeholder={isLoadingSubs ? "Loading..." : "Select Subjects"}
          options={subCategories}
          max={5}
          value={selectedSubjects}
          onChange={(items) => onSubjectsChange(items)}
          disabled={!selectedCategory || isLoadingSubs}
        />
      </div>
    </div>
  );
};

export default CategoryFilter;
