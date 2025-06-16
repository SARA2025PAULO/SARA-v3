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
exports.sendContractInvitation = exports.testEmailRest = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const node_fetch_1 = __importDefault(require("node-fetch")); // We will add this dependency
admin.initializeApp();
// HTTPS test function using SendGrid REST API
exports.testEmailRest = functions.https.onRequest(async (req, res) => {
    const sendgridApiKey = functions.config().sendgrid.key;
    if (!sendgridApiKey) {
        console.error("SendGrid API key not configured.");
        return res.status(500).send("SendGrid API key not configured.");
    }
    const msg = {
        personalizations: [
            {
                to: [
                    {
                        email: "destinatario@ejemplo.com", // Change to your test recipient email
                    },
                ],
            },
        ],
        from: {
            email: "notificaciones@sarachile.com", // Change to your verified SendGrid sender email
        },
        subject: "Prueba vía REST desde Firebase",
        content: [
            {
                type: "text/plain",
                value: "¡Hola desde REST API!",
            },
        ],
    };
    try {
        console.log('SendGrid API Key (partial):', sendgridApiKey ? sendgridApiKey.substring(0, 5) + '...' : 'Not configured');
        const response = await (0, node_fetch_1.default)("https://api.sendgrid.com/v3/mail/send", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${sendgridApiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(msg),
        });
        const responseBody = await response.text();
        console.log(`SendGrid API Response (testEmailRest): Status - ${response.status}, Body - ${responseBody}`);
        if (response.ok) {
            console.log("Correo REST enviado con éxito (testEmailRest)");
            res.status(200).send("Correo REST enviado con éxito (testEmailRest)");
        }
        else {
            console.error(`Error enviando correo REST (testEmailRest): ${response.status} - ${responseBody}`);
        }
    }
    catch (error) {
        console.error('Error in testEmailRest function:', error);
        res.status(500).send('Error in testEmailRest function');
    }
});
// Firestore trigger function using SendGrid REST API
exports.sendContractInvitation = functions.firestore
    .document('contracts/{contractId}')
    .onCreate(async (snap, context) => {
    const contratoData = snap.data();
    const tenantEmail = contratoData.tenantEmail;
    const tenantName = contratoData.tenantName;
    const sendgridApiKey = functions.config().sendgrid.key;
    const contractId = context.params.contractId;
    // Define registration URL and HTML button
    const registrationUrl = "https://sara-2-0.vercel.app/login";
    const htmlButton = `
  <p>Hola ${tenantName},</p>
  <p>Has sido invitado a un nuevo contrato en SARA.
     Haz clic en el botón de abajo para registrarte y ver los detalles:</p>

  <table cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
    <tr>
      <td align="center" bgcolor="#4CAF50" style="border-radius:5px;">
        <a
          href="https://sara-2-0.vercel.app/login"
          target="_blank"
          style="
            display: inline-block;
            padding: 12px 24px;
            font-size: 16px;
            color: #ffffff;
            text-decoration: none;
            font-weight: bold;
          "
        >
          Registrarse en SARA
        </a>
      </td>
    </tr>
  </table>

  <p>Saludos,<br/>El equipo de SARA</p>
 `;
    console.log('Tenant Email:', tenantEmail);
    console.log('Tenant Name:', tenantName);
    console.log('SendGrid API Key is configured:', !!sendgridApiKey); // Log if the key exists
    console.log('Registration URL:', registrationUrl);
    console.log('HTML Button:', htmlButton);
    if (!tenantEmail || !tenantName || !sendgridApiKey) {
        if (!tenantEmail || !tenantName) {
            console.warn('Missing tenantEmail or tenantName in new contract document.');
        }
        if (!sendgridApiKey) {
            console.error("SendGrid API key not configured for sendContractInvitation.");
        }
        return null; // Exit if essential data or API key is missing
    }
    const msg = {
        personalizations: [{ to: [{ email: tenantEmail }] }],
        from: { email: 'notificaciones@sarachile.com' }, // Replace with your verified SendGrid sender email
        subject: 'Has sido invitado a un contrato en SARA',
        content: [
            { type: 'text/plain', value: `Hola ${tenantName}, visita: https://sara-2-0.vercel.app/login` },
            { type: 'text/html', value: htmlButton }
        ]
    };
    console.log('SendGrid API Key (partial):', sendgridApiKey ? sendgridApiKey.substring(0, 5) + '...' : 'Not configured');
    try {
        console.log('Message object:', JSON.stringify(msg, null, 2));
        const response = await (0, node_fetch_1.default)('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${sendgridApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(msg),
        });
        const responseBody = await response.text();
        console.log(`SendGrid API Response (sendContractInvitation): Status - ${response.status}, Body - ${responseBody}`);
        if (response.ok) {
            console.log(`Invitation email sent to ${tenantEmail} for contract ${contractId}`);
        }
        else {
            console.error(`Error sending invitation email to ${tenantEmail} (sendContractInvitation): ${response.status} - ${responseBody}`);
            // Optionally re-throw the error or handle it based on your needs
            // throw new functions.https.HttpsError('internal', 'Failed to send invitation email', responseBody);
        }
        return null; // Indicate that the function completed successfully
    }
    catch (error) {
        console.error(`Error in sendContractInvitation function for contract ${contractId}:`, error);
        // Optionally re-throw the error or handle it based on your needs
        // throw new functions.https.HttpsError('internal', 'Error in sendContractInvitation function', error);
    }
});
