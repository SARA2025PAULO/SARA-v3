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
exports.sendContractInvitation = functions.firestore
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
    const htmlButton = `
      <p>Hola ${tenantName},</p>
      <p>Has sido invitado a un nuevo contrato en SARA. Haz clic en el botón de abajo para registrarte y ver los detalles:</p>
      <table cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
        <tr>
          <td align="center" bgcolor="#4CAF50" style="border-radius:5px;">
            <a href="${registrationUrl}" target="_blank" style="
              display: inline-block;
              padding: 12px 24px;
              font-size: 16px;
              color: #ffffff;
              text-decoration: none;
              font-weight: bold;
            ">Registrarse en SARA</a>
          </td>
        </tr>
      </table>
      <p>Saludos,<br/>El equipo de SARA</p>
    `;
    const msg = {
        personalizations: [{ to: [{ email: tenantEmail }] }],
        from: { email: 'notificaciones@sarachile.com' },
        subject: 'Has sido invitado a un contrato en SARA',
        content: [
            { type: 'text/plain', value: `Hola ${tenantName}, visita: ${registrationUrl}` },
            { type: 'text/html', value: htmlButton },
        ],
    };
    try {
        console.log('SendGrid API Key (partial):', sendgridApiKey.substring(0, 5) + '...');
        console.log('Mensaje:', JSON.stringify(msg, null, 2));
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
    }
    catch (error) {
        console.error(`Error in sendContractInvitation ${context.params.contractId}:`, error);
    }
});
