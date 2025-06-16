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
exports.sendTestEmail = void 0;
const functions = __importStar(require("firebase-functions"));
const mail_1 = __importDefault(require("@sendgrid/mail"));
// Initialize SendGrid with the API key from environment variables
mail_1.default.setApiKey(functions.config().sendgrid.key);
exports.sendTestEmail = functions.https.onRequest(async (req, res) => {
    const msg = {
        to: 'test@example.com', // Replace with your desired recipient email
        from: 'notifications@sarachile.com', // Replace with your verified SendGrid sender email
        subject: 'Test Email from Firebase Function',
        text: 'This is a test email sent from a Firebase HTTPS function using SendGrid.',
        html: '<p>This is a test email sent from a Firebase HTTPS function using SendGrid.</p>',
    };
    try {
        await mail_1.default.send(msg);
        console.log('Test email sent successfully');
        res.status(200).send('Test email sent successfully!');
    }
    catch (error) {
        console.error('Error sending test email:', error);
        if (error.response) {
            console.error(error.response.body);
        }
        res.status(500).send('Failed to send test email.');
    }
});
