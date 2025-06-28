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
exports.sendEmailOnCreate = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Correctly import the SendGrid mail service object
const mail_1 = __importDefault(require("@sendgrid/mail"));
admin.initializeApp();
// It's crucial to set the SendGrid API Key in your Firebase environment.
// Use this command to set it:
// firebase functions:config:set sendgrid.key="YOUR_SENDGRID_API_KEY"
const SENDGRID_API_KEY = functions.config().sendgrid?.key;
if (SENDGRID_API_KEY) {
    // Now this call will work because sgMail is the correct object
    mail_1.default.setApiKey(SENDGRID_API_KEY);
}
else {
    console.error('FATAL ERROR: SendGrid API key is not configured. Emails will fail to send.');
}
/**
 * Triggered by the creation of a document in the 'mail' collection.
 * This function sends an email using the data from the new document.
 */
exports.sendEmailOnCreate = functions.firestore
    .document('mail/{mailId}')
    .onCreate(async (snap, context) => {
    if (!SENDGRID_API_KEY) {
        console.error('Could not send email because SendGrid API Key is not set.');
        return;
    }
    const mailData = snap.data();
    const msg = {
        to: mailData.to,
        from: 'notificaciones@sarachile.com', // This must be a verified sender in SendGrid
        subject: mailData.message.subject,
        html: mailData.message.html,
    };
    try {
        console.log(`Attempting to send email to ${msg.to}`);
        await mail_1.default.send(msg);
        console.log('Email sent successfully via SendGrid.');
    }
    catch (error) {
        console.error('Error sending email with SendGrid:');
        if (error.response) {
            console.error(error.response.body);
        }
        else {
            console.error(error);
        }
    }
});
