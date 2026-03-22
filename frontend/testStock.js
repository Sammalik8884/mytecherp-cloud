import axios from 'axios';

async function testApi() {
    try {
        const loginRes = await axios.post('http://localhost:5031/api/Auth/login', {
            email: 'admin@company.com',
            password: 'Password123!'
        });
        const token = loginRes.data.token;
        console.log("Logged in");

        // The user just added stock, so we need to know for which product.
        // I will just get the first product id from the backend.
        const prodRes = await axios.get('http://localhost:5031/api/Product?pageNumber=1&pageSize=10', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const products = prodRes.data.data;
        if (!products || products.length === 0) {
            console.log("No products found for test user.");
            // Try another email? 
            return;
        }

        console.log("Found products, getting stock for Product ID:", products[0].id);

        const stockRes = await axios.get(`http://localhost:5031/api/Inventory/stock/${products[0].id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log("STOCK RESPONSE FOR ID", products[0].id, ":");
        console.log(JSON.stringify(stockRes.data, null, 2));

    } catch (error) {
        console.error("Error:", error.response?.data || error.message);
    }
}

testApi();
