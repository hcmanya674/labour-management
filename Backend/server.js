const express = require("express");//Starts an Express server.
const cors = require("cors");//Enables CORS (so your frontend can call the backend).
const routes = require("./routes");
const app = express();

app.use(cors());
app.use(express.json());//Reads JSON requests.
app.use("/", routes);
app.listen(3000, () => {

    console.log("Server running on port 3000");

});

