import React, { useRef, useEffect } from "react";
import "./MultiSelect.css";
import ReactDOM from "react-dom";

const MultiSelect = ({
  options,
  name,
  placeholder = "Select options",
  max = Infinity, // <-- new prop
  onChange,
  value = [],
  onOpen
}) => {
  const isOpenRef = React.useRef(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);
  const containerRef = useRef();
  const optionsRef = useRef([]);
  const dropdownRef = useRef(null);

  const handleSetOpen = (open) => {
    if (onOpen) {
      onOpen(open);
    } else {
      setIsOpen(open);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target) &&
        (!dropdownRef.current || !dropdownRef.current.contains(e.target))
      ) {
        handleSetOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateSelected = (newSelected) => {
    if (onChange) onChange(newSelected);
  };

  const toggleOption = (option) => {
    let newSelected;
    if (value.includes(option)) {
      newSelected = value.filter((o) => o !== option);
    } else {
      if (value.length >= max) {
        return;
      }
      newSelected = [...value, option];
    }
    updateSelected(newSelected);
  };

  const removeTag = (option) => {
    const newSelected = value.filter((o) => o !== option);
    updateSelected(newSelected);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      handleSetOpen(true);
      setHighlightedIndex((prev) => (prev + 1) % options.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      handleSetOpen(true);
      setHighlightedIndex((prev) => (prev - 1 + options.length) % options.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const option = options[highlightedIndex];
      toggleOption(option);
    } else if (e.key === "Backspace" && value.length && !isOpen) {
      removeTag(value[value.length - 1]);
    }
  };

  return (
    <div
      className="multi-select"
      ref={containerRef}
      tabIndex="0"
      onKeyDown={handleKeyDown}
    >
      <select name={name} multiple style={{ display: "none" }}>
        {value.map((option) => (
          <option key={option} value={option} selected>
            {option}
          </option>
        ))}
      </select>

      <div className="selected-values" onClick={() => handleSetOpen(!isOpen)}>
        {value.length
          ? value.map((item) => (
              <span key={item} className="tag">
                {item}{" "}
                <span
                  className="remove-tag"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTag(item);
                  }}
                >
                  ×
                </span>
              </span>
            ))
          : <span className="placeholder">{placeholder}</span>}
        <div className="arrow" />
      </div>

      {isOpen &&
  ReactDOM.createPortal(
    <div
      ref={dropdownRef}
      className="multi-select"
      style={{
        position: "absolute",
        top: containerRef.current?.getBoundingClientRect().bottom + window.scrollY,
        left: containerRef.current?.getBoundingClientRect().left,
        width: containerRef.current?.offsetWidth,
        zIndex: 99999,
      }}
    >
      <div className="options">
        {options.map((option, idx) => {
          const isSelected = value.includes(option);
          const isDisabled = !isSelected && value.length >= max;
          return (
            <div
              key={option}
              className={`option ${
                isSelected ? "selected" : ""
              } ${highlightedIndex === idx ? "highlighted" : ""} ${
                isDisabled ? "disabled" : ""
              }`}
              onClick={() => !isDisabled && toggleOption(option)}
            >
              {option}
            </div>
          );
        })}
      </div>
    </div>,
    document.body
  )}
    </div>
  );
};

export default MultiSelect;