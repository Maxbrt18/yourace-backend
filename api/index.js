const express = require("express");
const cors = require('cors');
const store = require("app-store-scraper");

const app = express();

app.use(cors({
    origin: '*'
}));

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
                        .filter(review => review.score >= 4 && review.title.length <= 22 && review.version[0] >= 3)
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

// Exporter l'app pour Vercel
module.exports = app;