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
exports.sendContractInvitation = void 0;
const functions = __importStar(require("firebase-functions"));
const node_fetch_1 = __importDefault(require("node-fetch"));
exports.sendContractInvitation = functions
    .region('us-central1') // Especifica la región para compatibilidad con Firestore
    .firestore
    .document('contracts/{contractId}')
    .onCreate(async (snap, context) => {
    const data = snap.data();
    if (!data) {
        console.error('No data associated with the event');
        return;
    }
    const tenantEmail = data.tenantEmail;
    const tenantName = data.tenantName;
    const sendgridApiKey = functions.config().sendgrid?.key;
    const registrationUrl = 'https://www.sarachile.com/login';
    if (!tenantEmail || !tenantName || !sendgridApiKey) {
        console.warn('Missing tenantEmail, tenantName, or SendGrid API key');
        return;
    }
    // Remove htmlButton as it will now be part of the SendGrid Dynamic Template
    // const htmlButton = `...`; 
    const msg = {
        personalizations: [{
                to: [{ email: tenantEmail }],
                dynamic_template_data: {
                    tenantName: tenantName,
                    registrationUrl: registrationUrl,
                    // Add other data if your template requires them
                },
            }],
        from: { email: 'notificaciones@sarachile.com' },
        template_id: 'd-0e5c724eda68490fb40916d7d6bf0274', // <--- Actualizado con el ID de tu plantilla
    };
    try {
        console.log('SendGrid API Key (partial):', sendgridApiKey.substring(0, 5) + '...');
        console.log('Mensaje a SendGrid:', JSON.stringify(msg, null, 2));
        const response = await (0, node_fetch_1.default)('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${sendgridApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(msg),
        });
        const responseBody = await response.text();
        console.log(`Status - ${response.status}, Body - ${responseBody}`);
        if (!response.ok) {
            console.error(`Error invitación a ${tenantEmail}: ${response.status} - ${responseBody}`);
        }
        else {
            console.log(`Invitación enviada exitosamente a ${tenantEmail}.`);
        }
    }
    catch (error) {
        console.error(`Error in sendContractInvitation ${context.params.contractId}:`, error);
    }
});
