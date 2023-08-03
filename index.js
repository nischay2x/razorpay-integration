import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import razorpay from "razorpay";
import { countryCourse, courses, currencies, subunit } from "./config.js";
dotenv.config();

const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY, PAYMENT_CONTACT, PAYMENT_CONTACT_MAIL, PAYMENT_CONTACT_NAME } = process.env;

const rpi = new razorpay({
    key_id: RAZORPAY_ID_KEY,
    key_secret: RAZORPAY_SECRET_KEY
});


const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.post("/order", validateBody, async (req, res) => {
    try {
        const { email, countryCode, courseCode } = req.body;
        
        const subunitMultiplier = subunit[countryCode];
        const currency = currencies[countryCode];
        const coursePrice = countryCourse[countryCode][courseCode];

        const orderAmount = coursePrice * subunitMultiplier;
        
        const orderOptions = {
            amount: orderAmount,
            currency: currency,
            receipt: email + ":" + new Date().getTime()
        }

        rpi.orders.create(orderOptions, (err, order) => {
            if(err) {
                console.log(err);
                return res.status(500).json({ success: false, msg: "Order creation failed" })
            } else {
                return res.status(200).json({
                    success: true,
                    msg: "Order Created",
                    order_id: order.id,
                    currency: currency,
                    amount: orderAmount,
                    key_id: RAZORPAY_ID_KEY,
                    product_name: courses[courseCode].name,
                    description: courses[courseCode].desc,
                    contact: PAYMENT_CONTACT,
                    name: PAYMENT_CONTACT_NAME,
                    email: PAYMENT_CONTACT_MAIL
                })
            }
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, msg: "Order Creation Failed." })
    }
});

function validateBody (req, res, next) {
    const body = req.body;

    console.log(body);
    if(!body.code || !body.email) {
        return res.status(405).json({ status: false, msg: "Required data not provided." });
    }

    const [countryCode, courseCode] = body.code.split("O");
    if(!Boolean(subunit[countryCode]) || !Boolean(courses[courseCode])) {
        return res.status(405).json({ status: false, msg: "Invalid country or course selected." })
    }

    req.body = { ...req.body, countryCode, courseCode };
    next();
}

app.listen(3000, (error) => {
    if(error) {
        console.error("Server could not be started.");
    } else {
        console.log("Server running at: 3000");
    }
})