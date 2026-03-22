const axios = require('axios');

async function test() {
    try {
        console.log("Fetching products anonymously...");
        const productRes = await axios.get('http://localhost:5269/api/Product?pageNumber=1&pageSize=5');

        console.log("Products response format type:");
        console.log("Is Array?", Array.isArray(productRes.data));
        console.log("Keys:", Object.keys(productRes.data));

        if (Array.isArray(productRes.data)) {
            console.log(`Array length: ${productRes.data.length}`);
            console.log("First item:", productRes.data[0] ? Object.keys(productRes.data[0]) : "None");
        } else {
            console.log("Data field:", productRes.data.data ? "Exists" : "Undefined");
        }

        console.log("\nFull Response Head:");
        console.log(JSON.stringify(productRes.data).substring(0, 500));

    } catch (err) {
        console.error("Error occurred:");
        if (err.response) {
            console.error(err.response.status, err.response.data);
        } else {
            console.error(err.message);
        }
    }
}

test();
