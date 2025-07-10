const store = require("app-store-scraper");

try {

    store.app({id: 1572073081}).then((data) => {
        store
            .reviews({
                id: "1572073081",
                country: "fr",
                sort: store.sort.HELPFUL,
            })
            .then((reviews) => {
                
                console.log("ok");

                const filteredReviews = reviews.filter((review) => {
                    return review.score > 3;
                });

                const versionText = document.getElementById("version");
                const changelogText = document.getElementById("features_text");
                const reviewsText = document.getElementById("reviews");

                const version = data && data.version;
                const changelog = data && data.releaseNotes;

                versionText.innerHTML = `Version : ${version}`;

                let formatted_text = [];

                changelog.split("\n").forEach((word) => {
                    formatted_text.push(word.includes(":") ? `<h3>${word}</h3>` : `${reformatChangelog(word)}<br>`);
                });

                changelogText.innerHTML = changelog && formatted_text && formatted_text.join("");

                //Get 5 random elements from the reviews array

                for (const review of getRandomElements(filteredReviews, 3)) {
                    reviewsText.innerHTML += `
                <div class="review-card">
                <header class="article-header">
                    <div>
                        <div class="category-title">
                            ${review.userName} | Version :
                            <span class="review-version">${review.version}</span>
                        </div>
                    </div>
                    <h2 class="article-title">
                    ${review.title}
                    <div class="star-rating">
                        <span style="width:${review.score * 20}%"></span>
                        </div>
                    </h2>
                    <p style="display: -webkit-box;-webkit-box-orient: vertical;-webkit-line-clamp: 7;overflow: hidden;">${review.text}</p>
                </header>
            </div>`;
                }

            })
            .catch((err) => {
                console.log(err);
            });
    });
} catch (err) {
    console.log("Error : " + err);
}