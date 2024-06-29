const cors = require('cors');
const express = require("express");
let store = require("app-store-scraper");
const https = require('https');
const fs = require('fs');


// This line is from the Node.js HTTPS documentation.
const options = {
    key: fs.readFileSync('/etc/letsencrypt/live/teslamate.rbart.xyz/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/teslamate.rbart.xyz/fullchain.pem')
};


store = require("app-store-scraper");


const app = express();

app.use(cors({
    origin: '*'
}));

https.createServer(options, app).listen(5000);

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
                    reviews: reviews.map((review) => {
                        if (review.score === 5 && review.title.length <= 22 && review.version[0] >= 3) {
                            return review;
                        }
                    }),
                });
            })
            .catch(console.log);
    });
});