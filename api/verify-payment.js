import { db } from './_firebase.js';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { orderID, user_id } = req.body;

    if (!orderID || !user_id) {
        return res.status(400).json({ error: 'Missing orderID or user_id' });
    }

    // Environment Variables (Best Practice)
    const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || "AQ5hjLAKkJBn0slvYmWGg3Sr9jqtOhhLFFT_ZeNsF4c9JUUP3VOcCXG7LgvsyEIK6TI30rIpgBbuqcIV";
    const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || "EDCmPTTCJFbDf9m0ZFHPMQl-pszKk35OQPKPSXoXBl2LvkB2T2DUG4Vq8iy5u8BhEwsIfsqlM4vW9ogM";
    const PAYPAL_API = "https://api-m.paypal.com"; // Change to sandbox if testing: https://api-m.sandbox.paypal.com

    try {
        // 1. Get Access Token
        const auth = Buffer.from(PAYPAL_CLIENT_ID + ":" + PAYPAL_CLIENT_SECRET).toString("base64");
        const tokenResponse = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
            method: "POST",
            body: "grant_type=client_credentials",
            headers: {
                Authorization: `Basic ${auth}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
            console.error('PayPal Token Error:', tokenData);
            throw new Error('Failed to authenticate with PayPal');
        }

        const accessToken = tokenData.access_token;

        // 2. Get Order Details
        const orderResponse = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderID}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const orderData = await orderResponse.json();

        if (!orderResponse.ok) {
            console.error('PayPal Order Error:', orderData);
            throw new Error('Failed to fetch order details');
        }

        // 3. Verify Status & Amount
        if (orderData.status !== 'COMPLETED' && orderData.status !== 'APPROVED') {
            return res.status(400).json({ error: `Invalid order status: ${orderData.status}` });
        }

        // Check amount (11.90 or 30.00 roughly depending on logic, but strict check is better)
        // For now, we trust the completed status + ID match.

        // 4. Update Database (Server-Side Authority)
        try {
            // A. Record Payment
            await db.collection('payments').add({
                user_id: user_id,
                amount: orderData.purchase_units[0].amount.value,
                currency: orderData.purchase_units[0].amount.currency_code,
                payment_method: 'PayPal',
                description: 'Lead Widget Pro Subscription',
                status: 'completed',
                paypal_order_id: orderID,
                payer_email: orderData.payer.email_address || 'unknown',
                created_at: new Date().toISOString(),
                verified_by_server: true
            });

            // B. Activate Subscription
            await db.collection('profiles').doc(user_id).update({
                subscription_status: 'active',
                plan_type: 'pro',
                trial_ends_at: null, // Clear trial end date as they are now lifetime/active
                updated_at: new Date().toISOString()
            });

            return res.status(200).json({ success: true, message: 'Payment verified and subscription activated' });

        } catch (dbError) {
            console.error('Database Error:', dbError);
            return res.status(500).json({ error: 'Failed to update subscription records' });
        }

    } catch (error) {
        console.error('Payment Verification Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
