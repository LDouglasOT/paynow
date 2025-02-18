const puppeteer = require('puppeteer');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');

// Middleware to parse JSON request bodies
app.use(bodyParser.json());

async function takeScreenshot(page, step) {
    const filename = `screenshot_${step}.png`;
    await page.screenshot({ path: filename });
    console.log(`📸 Screenshot saved: ${filename}`);
}

function logStep(step) {
    console.log(`✅ Step ${step} completed.`);
}

async function createTasks(phone, amount, paycode, network) {
    console.log("🔄 Starting headless Puppeteer process...");

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    });
    const page = await browser.newPage();

    try {
        // Step 1: Open the page
        console.log(`🌐 Opening page: ${network}`);
        await page.goto(network);
        await page.waitForTimeout(2000); // Wait for 2 seconds
        await takeScreenshot(page, "01_open_page");
        logStep("01_open_page");

        // Step 2: Enter the registration number
        console.log("⌨ Entering registration number...");
        await page.type('#dynamicmodel-pc_rgnumber', paycode);
        await page.waitForTimeout(1000); // Wait for 1 second
        await takeScreenshot(page, "02_enter_reg_number");
        logStep("02_enter_reg_number");

        // Step 3: Click the search button
        console.log("🔍 Clicking search button...");
        await page.click('.find-student-btn');
        await page.waitForTimeout(5000); // Wait for 5 seconds
        await takeScreenshot(page, "03_click_search");
        logStep("03_click_search");

        // Step 4: Scroll to amount input and enter amount
        console.log("📜 Scrolling to amount input field...");
        await page.evaluate(() => {
            const amountInput = document.getElementById('dynamicmodel-amount');
            amountInput.scrollIntoView({ block: 'center' });
        });
        await page.waitForTimeout(1000); // Wait for 1 second
        await takeScreenshot(page, "04_scroll_to_amount");
        logStep("04_scroll_to_amount");

        console.log("💰 Entering amount...");
        await page.type('#dynamicmodel-amount', amount);
        await page.waitForTimeout(1000); // Wait for 1 second
        await takeScreenshot(page, "05_enter_amount");
        logStep("05_enter_amount");

        // Step 5: Enter the phone number
        console.log("📱 Entering phone number...");
        await page.type('#dynamicmodel-phone_number', phone);
        await page.waitForTimeout(1000); // Wait for 1 second
        await takeScreenshot(page, "06_enter_phone");
        logStep("06_enter_phone");

        // Step 6: Click "Pay Fee" button
        console.log("💳 Clicking Pay Fee button...");
        await page.click('button.col-12.btn.btn-secondary');
        await page.waitForTimeout(3000); // Wait for 3 seconds
        await takeScreenshot(page, "07_click_pay_fee");
        logStep("07_click_pay_fee");

        // Step 7: Enter OTP code
        const otpCode = "123456";  // For demonstration; Replace with actual OTP fetching mechanism
        console.log("🔐 Entering OTP code...");
        await page.type('#paymentotp', otpCode);
        await page.waitForTimeout(1000); // Wait for 1 second
        await takeScreenshot(page, "08_enter_otp");
        logStep("08_enter_otp");

        // Step 8: Click the "Confirm" button
        console.log("✅ Clicking Confirm button...");
        await page.click('.confirm_payment');
        await page.waitForTimeout(5000); // Wait for 5 seconds
        await takeScreenshot(page, "09_click_confirm");
        logStep("09_click_confirm");

        console.log("🎉 ✅ Payment successfully processed, all screenshots saved.");

    } catch (e) {
        console.error(`❌ ERROR: ${e.message}`);
    } finally {
        await browser.close();
        console.log("🚪 Closing browser and ending process.");
    }
}

app.post('/process-school-payment', async (req, res) => {
    const { amount, paymentNumber, network, phone } = req.body;

    let networkUrl;
    if (network === "MTN") {
        networkUrl = "https://www.schoolpay.co.ug/site/get-student?chn=3";
    } else if (network === "AIRTEL") {
        networkUrl = "https://www.schoolpay.co.ug/site/get-student?chn=2";
    } else {
        networkUrl = "https://www.schoolpay.co.ug/site/get-student?chn=10";
    }

    console.log(`📢 Starting payment process for phone: ${phone}, amount: ${amount}, network: ${networkUrl}`);

    // Run createTasks in a separate thread
    createTasks(phone, amount, "1001054592", networkUrl);

    return res.status(200).json({ message: "Payment processing started. Check logs for updates." });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
