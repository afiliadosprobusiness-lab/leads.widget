const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function cleanLeads() {
    console.log('Starting cleanup of visitor leads...');

    // Query leads named 'Visitante'
    const snapshot = await db.collection('leads')
        .where('name', '==', 'Visitante')
        .get();

    if (snapshot.empty) {
        console.log('No visitor leads found to delete.');
        return;
    }

    console.log(`Found ${snapshot.size} visitor leads. Deleting...`);

    const batch = db.batch();
    let count = 0;

    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
        count++;
    });

    await batch.commit();
    console.log(`Successfully deleted ${count} visitor leads.`);
}

cleanLeads().catch(console.error);
