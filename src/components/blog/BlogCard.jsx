import { useNavigate } from 'react-router-dom';
import './BlogCard.css'


export default function ({ blogModel = undefined }) {
    const navigate = useNavigate();


    function goToBlog(blogData) {
        navigate(`/blog-details/${blogData._id}`, { state: { blogModel: blogData } });
    }

    return (
        <div className='blog-card' onClick={() => goToBlog(blogModel)}>
            {(blogModel.image && <img src={`${import.meta.env.VITE_APP_BASE_URL}/${blogModel.image}`} />)}
            <h1>{blogModel.title || 'No Title'}</h1>
            <p>{blogModel.description || 'No Description'}</p>
            <p>{blogModel.createdAt
                ? new Date(blogModel.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })
                : 'No Date'}</p>
        </div>
    );
}