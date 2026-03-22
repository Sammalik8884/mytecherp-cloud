const email = "hello@gmail.com";
const password = "Password123!";

async function testApi() {
    try {
        console.log("Logging in as", email);
        const loginRes = await fetch("http://localhost:5269/api/Auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        if (!loginRes.ok) {
            console.error("Login failed:", await loginRes.text());
            return;
        }

        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log("Logged in successfully. Token acquired.");

        console.log("Fetching products...");
        const prodRes = await fetch("http://localhost:5269/api/Product?pageNumber=1&pageSize=50", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!prodRes.ok) {
            console.error("Failed to fetch products:", await prodRes.text());
            return;
        }

        const products = await prodRes.json();
        console.log(`Fetched ${products.length} products.`);

        if (products.length === 0) {
            console.log("No products available for this tenant.");
            return;
        }

        const firstProdId = products[0].id;
        console.log("First product ID is:", firstProdId, "Name:", products[0].name);

        console.log(`Fetching stock for Product ID ${firstProdId}...`);
        const stockRes = await fetch(`http://localhost:5269/api/Inventory/stock/${firstProdId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!stockRes.ok) {
            console.error("Failed to fetch stock:", await stockRes.text());
            return;
        }

        const stockData = await stockRes.json();
        console.log("==== STOCK DATA ====");
        console.log(JSON.stringify(stockData, null, 2));
        console.log("====================");

    } catch (e) {
        console.error("Exception:", e);
    }
}

testApi();
