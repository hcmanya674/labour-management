const express = require("express");

const router = express.Router();

const {
    auth,
    db
} = require("./firebaseAdmin");


// =====================================================
// TEST API
// =====================================================

router.get("/", (req, res) => {

    res.send(
        "Backend running successfully"
    );

});


router.get("/test", (req, res) => {

    res.json({

        success: true,

        message:
            "Frontend connected successfully!"

    });

});


// =====================================================
// CREATE LEADER
// =====================================================

router.post("/createLeader", async (req, res) => {

    console.log("");
    console.log("======================================");
    console.log("CREATE LEADER REQUEST");
    console.log("======================================");

    try {

        // -------------------------------------------------
        // CHECK REQUEST BODY
        // -------------------------------------------------

        console.log(
            "Request body:",
            req.body
        );


        const body = req.body || {};


        const name =
            body.name;

        const phone =
            body.phone;

        const password =
            body.password;

        const region =
            body.region;


        console.log(
            "Name:",
            name
        );

        console.log(
            "Phone:",
            phone
        );

        console.log(
            "Password received:",
            password ? "YES" : "NO"
        );

        console.log(
            "Region:",
            region
        );


        // -------------------------------------------------
        // VALIDATION
        // -------------------------------------------------

        if (
            !name ||
            !phone ||
            !password ||
            !region
        ) {

            console.log(
                "VALIDATION FAILED"
            );

            return res.status(400).json({

                success: false,

                message:
                    "Please fill all fields."

            });

        }


        // -------------------------------------------------
        // CLEAN VALUES
        // -------------------------------------------------

        const cleanName =
            String(name)
                .trim()
                .toUpperCase();


        const cleanPhone =
            String(phone)
                .trim();


        const cleanPassword =
            String(password)
                .trim();


        const cleanRegion =
            String(region)
                .trim();


        console.log(
            "Clean values:",
            {
                name: cleanName,
                phone: cleanPhone,
                region: cleanRegion
            }
        );


        // -------------------------------------------------
        // PHONE VALIDATION
        // -------------------------------------------------

        if (
            !/^[0-9]{10}$/.test(
                cleanPhone
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Phone number must contain exactly 10 digits."

            });

        }


        // -------------------------------------------------
        // PASSWORD VALIDATION
        // -------------------------------------------------

        if (
            cleanPassword.length < 6
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Password must contain at least 6 characters."

            });

        }


        // -------------------------------------------------
        // INTERNAL FIREBASE EMAIL
        // -------------------------------------------------

        const internalEmail =
            `${cleanPhone}@leader.labour.local`;


        console.log(
            "Internal Firebase email:",
            internalEmail
        );


        // -------------------------------------------------
        // CHECK EXISTING LEADER
        // -------------------------------------------------

        try {

            await auth.getUserByEmail(
                internalEmail
            );


            return res.status(400).json({

                success: false,

                message:
                    "A leader with this phone number already exists."

            });

        }

        catch (error) {

            // User does not exist.
            // Continue.

            console.log(
                "No existing Firebase user found."
            );

        }


        // -------------------------------------------------
        // CREATE FIREBASE AUTH USER
        // -------------------------------------------------

        console.log(
            "Creating Firebase Authentication user..."
        );


        const userRecord =
            await auth.createUser({

                email:
                    internalEmail,

                password:
                    cleanPassword,

                disabled:
                    false

            });


        console.log(
            "Firebase user created:",
            userRecord.uid
        );


        // -------------------------------------------------
        // CREATE FIRESTORE PROFILE
        // -------------------------------------------------

        await db
            .collection("users")
            .doc(userRecord.uid)
            .set({

                uid:
                    userRecord.uid,

                name:
                    cleanName,

                phone:
                    cleanPhone,

                region:
                    cleanRegion,

                role:
                    "leader",

                active:
                    true,

                mustChangePassword:
                    false,

                createdAt:
                    new Date()

            });


        console.log(
            "Firestore leader profile created."
        );


        // -------------------------------------------------
        // SUCCESS
        // -------------------------------------------------

        console.log(
            "LEADER CREATED SUCCESSFULLY"
        );

        console.log(
            "======================================"
        );


        return res.status(200).json({

            success: true,

            message:
                "Leader Created Successfully",

            leader: {

                uid:
                    userRecord.uid,

                name:
                    cleanName,

                phone:
                    cleanPhone,

                region:
                    cleanRegion

            }

        });

    }

    catch (error) {

        console.error(
            "CREATE LEADER ERROR:"
        );

        console.error(
            error
        );


        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Unable to create leader."

        });

    }

});


module.exports = router;