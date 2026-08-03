const API_URL = "https://labour-management-backend-y6g2.onrender.com";

async function testBackend() {
    try {
        const response = await fetch(API_URL + "/test");
        const data = await response.json();

        console.log(data);
        alert(data.message);

    } catch (err) {
        console.error(err);
    }
}