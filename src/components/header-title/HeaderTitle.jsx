import './HeaderTitle.css';
import React from 'react';
export default function ({ title, description }) {
    return (
        <div className="header-title">
            <h1>{title}</h1>
            {description && <p>{description}</p>}
        </div>
    );
// import React from "react";
// import './HeaderTitle.css';

// export default function ({ title, description }) {
//     return (
//         <div className="header-title">
//             <h1>{title}</h1>
//             {description && <p>{description}</p>}
//         </div>
//     );
// }



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