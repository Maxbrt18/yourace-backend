const express = require("express");
const cors = require('cors');
const store = require("app-store-scraper");

const app = express();

// Use CORS middleware to allow all origins
app.use(cors({
    origin: '*'
}));

// Listen on the port specified by the PORT environment variable
const PORT = process.env.PORT || 8080;

app.get("/", (req, res) => {
    store.app({ id: 1572073081 }).then((data) => {
        store
            .reviews({
                id: "1572073081",
                country: "fr",
                sort: store.sort.HELPFUL,
            })
            .then((reviews) => {
                res.json({
                    version: data.version,
                    releaseNotes: data.releaseNotes,
                    reviews: reviews
                        .filter(review => review.score === 5 && review.title.length <= 22 && review.version[0] >= 3)
                        .map(review => ({
                            title: review.title,
                            text: review.text,
                            rating: review.score,
                            version: review.version,
                        })),
                });
            })
            .catch(console.log);
    });
});

// Listen for HTTP requests on 0.0.0.0:${PORT}
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is listening on port ${PORT}`);
});
