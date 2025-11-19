import got from 'got';

// Define the WordPress API base URL
const WP_API_BASE = process.env.NEXT_PUBLIC_WP_API_URL;

// Helper function to convert WordPress date format to ISO format
// WordPress: "YYYY-MM-DD HH:mm:ss" -> ISO: "YYYY-MM-DDTHH:mm:ss"
function convertWordPressDateToISO(wpDate) {
    if (!wpDate) return '';
    // Replace space with 'T' to convert to ISO format
    return wpDate.replace(' ', 'T');
}

// Fetch JSON from custom wp endpoint /latest-posts
async function fetchWordPressPosts() {
    if (!WP_API_BASE) {
        throw new Error("Missing NEXT_PUBLIC_WP_API_URL in .env file.");
    }

    const endpoint = `${WP_API_BASE}/latest-posts`;

    try {
        const res = await got(endpoint, {responseType: "json" });

        // WordPress returns an array directly, not wrapped in { posts: [...] }
        if (!Array.isArray(res.body)) {
            console.error("Unexpected API response format. Expected array.");
            return [];
        }

        return res.body || [];
    } catch (error) {
        console.error("Error fetching WordPress posts: ", error.message);
        return [];
    }
}

// --- Function: Return sorted list of posts (id, title, date) ---
export async function getSortedPostsData() {
    const posts = await fetchWordPressPosts(); 

    if (!posts || posts.length === 0) {
        return [];
    }

    // Sort posts alphabetically by title
    posts.sort(function (a, b) {
        return (a.post_title || '').localeCompare(b.post_title || '');
    });

    // Map WordPress fields to expected format: ID→id, post_title→title, post_date→date
    return posts.map(post => {
        return {
            id: post.ID.toString(),
            title: post.post_title || '',
            date: convertWordPressDateToISO(post.post_date),
        }
    });
}

// --- Function: Return all post IDs (for Next.js dynamic routing) ---
export async function getAllPostIds() {
    const posts = await fetchWordPressPosts();

    if (!posts || posts.length === 0) {
        return [];
    }

    // Next.js requires IDs to be nested inside { params: { id: ... } }
    return posts.map(post => {
        return {
            params: {
                id: post.ID.toString(),
            }
        }
    });
}

// --- Function: Return full post data by ID ---
export async function getPostData(id) {
    const posts = await fetchWordPressPosts();

    // Filter posts to find the one matching the given ID
    const match = posts.find(post => post.ID.toString() === id);

    // If no match, return a placeholder "empty" object
    if (!match) {
        return {
            id: '',
            title: '',
            date: '',
            content: '',
        }
    } else {
        // Map WordPress fields to expected format
        return {
            id: match.ID.toString(),
            title: match.post_title || '',
            date: convertWordPressDateToISO(match.post_date),
            content: match.post_content || '',
        };
    }
}
