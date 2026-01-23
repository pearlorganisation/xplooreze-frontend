import { useEffect, useState } from "react";
import BlogCard from "../../components/blog/BlogCard";
import './BlogPage.css';
import ReactPaginate from "react-paginate";
import { APP_NAME } from "../../data/config";
import HeaderTitle from "../../components/header-title/HeaderTitle";
import { getBlogs } from "../../data/modules/blog-module";

export default function BlogPage() {

    const [blogs, setBlogs] = useState([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0); 

    useEffect(() => {
        const fetchBlogs = async () => {
            try {
                // Pass page + 1 because API is 1-indexed
                const { data, pagination } = await getBlogs({ page: page + 1 }); 
                setBlogs(data || []);
                setTotalPages(pagination?.totalPages || 0); // Store total pages
            } catch (error) {
                console.log('Something went wrong while retrieving blogs:', error);
            }
        }

        fetchBlogs();
    }, [page]); // Re-run effect when page changes


    return (
        <div className="blog-page">
            <HeaderTitle
                title={`Blogs By ${APP_NAME}`} />
            <div className="blog-page-content">
                {blogs.map((item) => ( // Added 'any' type for item
                    <div key={item._id}> {/* Use _id for key */}
                        <BlogCard blogModel={item} />
                    </div>
                ))}
            </div>

            {/* Only show pagination if there is more than one page */}
            {totalPages > 1 && (
                <ReactPaginate
                    pageCount={totalPages} // Use totalPages from state
                    pageRangeDisplayed={3}
                    marginPagesDisplayed={2}
                    forcePage={page} // page state is 0-indexed
                    onPageChange={(event) => setPage(event.selected)}
                    containerClassName="pagination"
                    activeClassName="active"
                    // Optional: Add styling for prev/next buttons
                    previousLabel="<"
                    nextLabel=">"
                />
            )}
        </div>
    );
}