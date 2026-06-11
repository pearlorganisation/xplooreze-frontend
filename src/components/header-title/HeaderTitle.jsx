import React from "react";
import "./HeaderTitle.css";

export default function HeaderTitle({ title, description }) {
  return (
    <div className="header-title">
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
  );
}
