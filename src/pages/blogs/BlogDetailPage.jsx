import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./BlogDetailPage.css";
import { getBlog } from "../../data/modules/blog-module";

function BlogDetailPage() {
    const { blogId } = useParams();

    const [blogModel, setBlogModel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!blogId) {
            setError("Invalid blog URL");
            setLoading(false);
            return;
        }

        const fetchBlog = async () => {
            try {
                const blog = await getBlog(blogId);
                setBlogModel(blog);
            } catch (err) {
                setError("Failed to load blog");
            } finally {
                setLoading(false);
            }
        };

        fetchBlog();
    }, [blogId]);

    // Construct the absolute image URL safely
    const imageUrl = blogModel?.image 
        ? `${import.meta.env.VITE_APP_BASE_URL}/${blogModel.image}`
        : ""; // Or provide a default fallback image URL here

    if (loading) {
        return <div className="blog-details">Loading...</div>;
    }

    if (error || !blogModel) {
        return <div className="blog-details">{error || "Blog not found"}</div>;
    }

    return (
        <div className="blog-details">
            {/* SEO and Link Preview Tags */}
            <Helmet>
                <title>{blogModel.title}</title>
                <meta name="description" content={blogModel.description} />

                {/* Open Graph / Facebook / WhatsApp */}
                <meta property="og:type" content="article" />
                <meta property="og:title" content={blogModel.title} />
                <meta property="og:description" content={blogModel.description} />
                <meta property="og:image" content={imageUrl} />
                <meta property="og:url" content={window.location.href} />

                {/* Twitter */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={blogModel.title} />
                <meta name="twitter:description" content={blogModel.description} />
                <meta name="twitter:image" content={imageUrl} />
            </Helmet>

            <div className="blog-details-item">
                <h1>{blogModel.title || "No Title"}</h1>

                <p>{blogModel.description || "No Description"}</p>

                <p>
                    {blogModel.createdAt
                        ? new Date(blogModel.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                          })
                        : "No Date"}
                </p>

                {blogModel.image && (
                    <img
                        src={imageUrl}
                        alt={blogModel.title}
                    />
                )}

                <div
                    className="blog-body"
                    dangerouslySetInnerHTML={{
                        __html: blogModel.body || "",
                    }}
                />
            </div>
        </div>
    );
}

export default BlogDetailPage;