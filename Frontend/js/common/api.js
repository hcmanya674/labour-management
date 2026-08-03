const API_URL = "http://localhost:3000";

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