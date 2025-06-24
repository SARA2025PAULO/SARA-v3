"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resendContractInvitation = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const mail_1 = __importDefault(require("@sendgrid/mail"));
// La inicialización de admin se elimina de aquí. Se confía en la de index.ts
const sendgridApiKey = functions.config().sendgrid?.key;
if (sendgridApiKey) {
    mail_1.default.setApiKey(sendgridApiKey);
}
else {
    console.error("FATAL: SendGrid API Key not configured.");
}
const db = admin.firestore();
exports.resendContractInvitation = functions.https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }
    if (!sendgridApiKey) {
        console.error("resendContractInvitation: SendGrid API Key is not available.");
        res.status(500).json({ error: { message: "Internal Server Error: Mail service not configured." } });
        return;
    }
    try {
        const idToken = req.headers.authorization?.split('Bearer ')[1];
        if (!idToken) {
            res.status(401).json({ error: { message: 'Authentication token not provided.' } });
            return;
        }
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const callerUid = decodedToken.uid;
        const { contractId } = req.body;
        if (!contractId) {
            res.status(400).json({ error: { message: 'Contract ID is required.' } });
            return;
        }
        const contractRef = db.collection('contracts').doc(contractId);
        const contractSnap = await contractRef.get();
        if (!contractSnap.exists) {
            res.status(404).json({ error: { message: 'Contract not found.' } });
            return;
        }
        const contractData = contractSnap.data();
        if (contractData.creatorId !== callerUid && contractData.landlordId !== callerUid) {
            res.status(403).json({ error: { message: 'You do not have permission to resend this invitation.' } });
            return;
        }
        if (contractData.status !== 'pending_approval') {
            res.status(412).json({ error: { message: `Contract is not in a pending state. Current state: ${contractData.status}` } });
            return;
        }
        const { tenantEmail, landlordName, propertyName } = contractData;
        const invitationUrl = `https://sara3o.web.app/login?contractId=${contractId}&email=${encodeURIComponent(tenantEmail)}`;
        const msg = {
            to: tenantEmail,
            from: { name: "S.A.R.A.", email: "notificaciones@sarachile.com" },
            template_id: 'd-19a933a059634b459a99c7553951c653',
            dynamic_template_data: {
                landlordName,
                propertyName,
                invitationUrl,
            },
        };
        await mail_1.default.send(msg);
        res.status(200).json({ data: { success: true, message: `Invitation sent to ${tenantEmail}` } });
    }
    catch (error) {
        console.error("--- UNEXPECTED EXCEPTION IN resendContractInvitation ---", error);
        res.status(500).json({ error: { message: 'An unexpected server error occurred while resending the email.' } });
    }
});
