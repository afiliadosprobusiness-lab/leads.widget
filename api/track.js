import { db } from './_firebase.js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { widgetId, eventType } = req.body;

    if (!widgetId) return res.status(400).json({ error: 'widgetId is required' });

    try {
        // Get client info
        const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'] || 'Unknown';
        const referer = req.headers['referer'] || req.headers['referrer'] || 'Direct';
        const timestamp = new Date();
        const dateKey = timestamp.toISOString().split('T')[0]; // YYYY-MM-DD for easy querying

        // SECURITY: Check if IP is blocked (silent fail for tracking)
        try {
            const blockedQuery = await db.collection('blocked_ips')
                .where('ip_address', '==', clientIp)
                .where('widget_id', '==', widgetId)
                .limit(1)
                .get();

            if (!blockedQuery.empty) {
                return res.status(200).json({ success: true, blocked: true });
            }
        } catch (blockCheckError) {
            console.error('Block check error in tracking:', blockCheckError.message);
        }

        // Basic rate limiting/duplicate check (Make it non-blocking to avoid index errors)
        try {
            const recentTrack = await db.collection('analytics')
                .where('ip', '==', clientIp)
                .where('widget_id', '==', widgetId)
                .where('created_at', '>', new Date(Date.now() - 5000).toISOString())
                .limit(1)
                .get();

            if (!recentTrack.empty && eventType === 'view') {
                return res.status(200).json({ success: true, cached: true });
            }
        } catch (e) {
            console.error('Non-critical track check failed:', e.message);
        }

        // Save analytics event
        await db.collection('analytics').add({
            widget_id: widgetId,
            event_type: eventType || 'view', // 'view', 'chat_open', 'lead_captured', 'message_sent'
            ip: clientIp,
            user_agent: userAgent,
            referer: referer,
            date: dateKey, // For easy daily aggregation
            created_at: timestamp.toISOString()
        });

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Track error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
