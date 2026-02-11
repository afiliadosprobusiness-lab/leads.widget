import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
    try {
        let serviceAccount = null;
        const saVar = process.env.FIREBASE_SERVICE_ACCOUNT;

        if (saVar) {
            try {
                // Handle both stringified JSON and potential formatting issues
                serviceAccount = JSON.parse(saVar);

                // Fix for private_key newlines which often break in Env Vars
                if (serviceAccount.private_key) {
                    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
                }
            } catch (jsonError) {
                console.error('Firebase SA JSON Parse Error:', jsonError.message);
            }
        }

        if (serviceAccount && serviceAccount.project_id) {
            initializeApp({
                credential: cert(serviceAccount)
            });
            console.log('Firebase Admin initialized successfully with Service Account');
        } else {
            console.warn('Firebase Admin: No valid Service Account found, using default credentials');
            initializeApp();
        }
    } catch (error) {
        console.error('Firebase Admin Init Critical Error:', error);
    }
}

export const db = getFirestore();
