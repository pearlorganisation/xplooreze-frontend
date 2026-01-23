import './HeaderTitle.css';

export default function ({ title, description }) {
    return (
        <div className="header-title">
            <h1>{title}</h1>
            {description && <p>{description}</p>}
        </div>
    );
}