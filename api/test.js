const app = require("./index");

const server = app.listen(0, async () => {
    const response = await fetch(`http://localhost:${server.address().port}/`);
    console.log(response.status, response.headers.get("cache-control"));
    console.log(JSON.stringify(await response.json(), null, 2));
    server.close();
});
