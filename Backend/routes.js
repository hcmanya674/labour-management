
const express = require("express");
const router = express.Router();

const { auth, db } = require("./firebaseAdmin");

// -------------------------------------
// Test API
// -------------------------------------

router.get("/", (req, res) => {
    res.send("Backend running successfully");
});

router.get("/test", (req, res) => {
    res.json({
        success: true,
        message: "Frontend connected successfully!"
    });
});

// -------------------------------------
// Create Leader
// -------------------------------------

router.post("/createLeader", async (req, res) => {

    try {

        const {
            name,
            email,
            password,
            phone,
            region
        } = req.body;

        if (!name || !email || !password || !phone || !region) {

            return res.status(400).json({
                success: false,
                message: "Please fill all fields."
            });

        }

        // Check if email already exists
        try {

            await auth.getUserByEmail(email);

            return res.status(400).json({
                success: false,
                message: "Leader already exists."
            });

        } catch (err) {
            // Email doesn't exist → continue
        }

        // Create Firebase Authentication user
        const userRecord = await auth.createUser({

            email,
            password

        });

        // Save leader in Firestore
        await db.collection("users").doc(userRecord.uid).set({

            uid: userRecord.uid,
            name,
            email,
            phone,
            region,

            role: "leader",

            active: true,
            mustChangePassword: true,
            createdAt: new Date()

        });

        res.json({

            success: true,
            message: "Leader Created Successfully"

        });

    }

    catch (error) {

        console.log(error);

        res.status(500).json({

            success: false,
            message: error.message

        });

    }

});

module.exports = router;