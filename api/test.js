let store = require("app-store-scraper");

store = require("app-store-scraper");

store.app({ id: 1572073081 }).then((data) => {
        store
            .reviews({
                id: "1572073081",
                country: "fr",
                sort: store.sort.HELPFUL,
            })
            .then((reviews) => {
                console.log(reviews)
            })
            .catch(console.log);
    });
