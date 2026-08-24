const express = require("express");
const cors = require("cors");

const app = express();


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));


// =====================================================
// ROUTES
// =====================================================

const routes = require("./routes");

app.use("/", routes);


// =====================================================
// SERVER
// =====================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

    console.log(
        `Server running on port ${PORT}`
    );

});