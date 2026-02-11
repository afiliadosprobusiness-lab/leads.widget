import { db } from './_firebase.js';

export default async function handler(req, res) {
    try {
        // 1. Check connection
        const profilesSnap = await db.collection('profiles').limit(1).get();

        return res.status(200).json({
            status: 'ok',
            profiles_found: !profilesSnap.empty,
            profiles_count_sample: profilesSnap.size,
            env: {
                projectId: process.env.VITE_FIREBASE_PROJECT_ID ? 'set' : 'missing',
                serviceAccount: process.env.FIREBASE_SERVICE_ACCOUNT ? 'set' : 'missing'
            }
        });
    } catch (error) {
        return res.status(500).json({ error: error.message, stack: error.stack });
    }
}
