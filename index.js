const express = require('express');
const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());

// Helper function to take a screenshot
async function takeScreenshot(driver, step) {
    const screenshot = await driver.takeScreenshot();
    const filename = `screenshot_${step}.png`;
    fs.writeFileSync(filename, screenshot, 'base64');
    console.log(`📸 Screenshot saved: ${filename}`);
}

// Helper function to log steps
function logStep(step) {
    console.log(`✅ Step ${step} completed.`);
}


async function processPayment(phone, amount, network) {
    console.log("🔄 Starting headless Selenium process...");
    var paycode = "1001054592";
    // Set up the Selenium WebDriver options
    const options = new chrome.Options();
    options.addArguments('--headless', '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu');
    
    const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    try {
        // Step 1: Open the page
        console.log(`🌐 Opening page: ${network}`);
        await driver.get(network);
        await driver.sleep(2000);  // Let the page load completely
        await takeScreenshot(driver, "01_open_page");
        logStep("01_open_page");

        // Step 2: Enter the registration number
        console.log("⌨ Entering registration number...");
        const regInput = await driver.findElement(By.css('form input[name="DynamicModel[pc_rgnumber]"]'));
        await regInput.sendKeys(paycode);
        await takeScreenshot(driver, "02_enter_reg_number");
        logStep("02_enter_reg_number");

        // Step 3: Click the search button
        console.log("🔍 Clicking search button...");
        const searchButton = await driver.findElement(By.className('find-student-btn'));
        await searchButton.click();
        await driver.sleep(3000);  // Wait for the results to load
        await takeScreenshot(driver, "03_click_search");
        logStep("03_click_search");

        // Step 4: Wait for the amount input field in the form to appear
        console.log("📜 Waiting for the amount input field...");
        const amountInput = await driver.wait(until.elementLocated(By.css('form input[type="text"][name="DynamicModel[amount]"]')), 15000);
        await driver.executeScript("arguments[0].scrollIntoView(true);", amountInput);
        await driver.sleep(1000);  // Allow for scrolling animation
        await takeScreenshot(driver, "04_scroll_to_amount");
        logStep("04_scroll_to_amount");

        // Step 5: Enter the amount
        console.log("💰 Entering amount...");
        await amountInput.sendKeys(amount);
        await driver.executeScript("arguments[0].blur();", amountInput);  // Unfocus the amount field
        await takeScreenshot(driver, "05_enter_amount");
        logStep("05_enter_amount");

        // Step 6: Enter the phone number
        console.log("📱 Entering phone number...");
        const phoneInput = await driver.findElement(By.css('form input[type="text"][name="DynamicModel[phone_number]"]'));
        await phoneInput.sendKeys(phone);
        await driver.executeScript("arguments[0].blur();", phoneInput);  // Unfocus the phone number field
        await takeScreenshot(driver, "06_enter_phone");
        logStep("06_enter_phone");

        // Step 7: Submit the form directly
        console.log("💳 Submitting the form...");
        const form = await driver.findElement(By.css('form[id="w0"]'));
        await form.submit();  // Submit the form directly
        await driver.sleep(3000);  // Wait for the form submission to complete
        await takeScreenshot(driver, "07_submit_form");
        logStep("07_submit_form");

        // Step 8: Wait for the confirmation page to load
        console.log("🌐 Waiting for the confirmation page...");
        await driver.wait(until.elementLocated(By.css('h3.web_h3')), 10000);  // Wait for the confirmation title to appear
        await takeScreenshot(driver, "08_wait_for_confirmation");
        logStep("08_wait_for_confirmation");

        // Step 9: Prompt user to enter the OTP
        console.log("🔒 Prompting for OTP...");
        const otpInput = await driver.findElement(By.css('input#paymentotp'));
        await otpInput.sendKeys('123456');  // Replace with the actual OTP you receive
        await takeScreenshot(driver, "09_enter_otp");
        logStep("09_enter_otp");

        // Step 10: Click on "Confirm" to proceed with payment
        console.log("🟢 Confirming payment...");
        const confirmButton = await driver.findElement(By.css('a.confirm_payment'));
        await confirmButton.click();
        await driver.sleep(3000);  // Wait for the payment confirmation
        await takeScreenshot(driver, "10_confirm_payment");
        logStep("10_confirm_payment");

        console.log("🎉 ✅ Payment successfully processed, all screenshots saved.");
    } catch (e) {
        console.log(`❌ ERROR: ${e}`);
    } finally {
        await driver.quit();
        console.log("🚪 Closing browser and ending process.");
    }
}


app.post('/process-school-payment', async (req, res) => {
    const { amount, paymentNumber, network, phone,paycode } = req.body;
    
    const networkUrl = {
        "MTN": "https://www.schoolpay.co.ug/site/get-student?chn=3",
        "AIRTEL": "https://www.schoolpay.co.ug/site/get-student?chn=2",
        "OTHER": "https://www.schoolpay.co.ug/site/get-student?chn=10"
    }[network] || networkUrl["OTHER"];

    console.log(`📢 Starting payment process for phone: ${phone}, amount: ${amount}, network: ${networkUrl}`);

    try {
        // Start the payment task
        await processPayment(phone, amount, paycode, networkUrl);
        return res.status(200).json({ message: "Payment processing started. Check logs for updates." });
    } catch (e) {
        console.log("Error during payment process:", e);
        return res.status(500).json({ message: "There was an error processing the payment." });
    }
});

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
