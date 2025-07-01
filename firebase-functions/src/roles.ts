
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as cors from 'cors';

const allowedOrigins = [
    'https://9000-firebase-sara20git-1749771769228.cluster-ve345ymguzcd6qqzuko2qbxtfe.cloudworkstations.dev',
    'https://sara-rent.web.app'
];

const corsHandler = cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('CORS policy violation'));
        }
    }
});

export const grantAdminRole = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        if (req.method !== 'POST') {
            res.status(405).send('Method Not Allowed');
            return;
        }

        const { email } = req.body;
        if (!email) {
            res.status(400).json({ error: 'Email is required.' });
            return;
        }

        try {
            const user = await admin.auth().getUserByEmail(email);
            await admin.auth().setCustomUserClaims(user.uid, { admin: true });
            res.status(200).json({ message: `Success! ${email} is now an admin.` });
        } catch (error: any) {
            console.error('Error granting admin role:', error);
            res.status(500).json({ error: error.message });
        }
    });
});
