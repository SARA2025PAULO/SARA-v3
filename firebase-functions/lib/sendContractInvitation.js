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
const admin = __importStar(require("firebase-admin"));
const node_fetch_1 = __importDefault(require("node-fetch"));
// Inicializa Firebase Admin si aún no lo has hecho en otro sitio
admin.initializeApp();
exports.sendContractInvitation = functions
    .region('us-central1') // Asegúrate de que la región coincida con tus otras funciones
    .firestore
    .document('contracts/{contractId}')
    .onCreate(async (snap, context) => {
    // 1. Obtén los datos del contrato
    const data = snap.data();
    const tenantEmail = data.tenantEmail;
    const tenantName = data.tenantName;
    const propertyName = data.propertyName;
    // 2. Verifica datos esenciales y API key de SendGrid
    const sendgridApiKey = functions.config().sendgrid?.key;
    if (!tenantEmail || !tenantName || !propertyName || !sendgridApiKey) {
        console.error('Faltan datos para enviar invitación o API key de SendGrid no configurada.', { tenantEmail, tenantName, propertyName, sendgridApiKey });
        return null;
    }
    // 3. Construye el cuerpo HTML con el botón de login
    const htmlBody = `
      <p>Hola ${tenantName},</p>
      <p>Has sido invitado a firmar un nuevo contrato de arriendo para la propiedad <strong>${propertyName}</strong>.</p>
      <p>Puedes revisar y firmar el contrato iniciando sesión en SARA:</p>
      <a
        href="https://sara-2-0.vercel.app/login"
        style="
          display:inline-block;
          padding:10px 20px;
          background-color:#4CAF50;
          color:#ffffff;
          text-decoration:none;
          border-radius:5px;
          font-weight:bold;
        "
        target="_blank"
      >
        Iniciar sesión en SARA
      </a>
      <p>Si no funciona el botón, copia y pega este enlace en tu navegador:</p>
      <p>https://sara-2-0.vercel.app/login</p>
      <br/>
      <p>Gracias,<br/>El equipo de SARA</p>
    `;
    // 4. Construye el mensaje para SendGrid
    const msg = {
        personalizations: [{ to: [{ email: tenantEmail }] }],
        from: { email: 'notificaciones@sarachile.com' }, // Tu remitente verificado en SendGrid
        subject: 'Invitación para firmar contrato de arriendo',
        content: [
            { type: 'text/plain', value: `Hola ${tenantName}, visita https://sara-2-0.vercel.app/login` },
            { type: 'text/html', value: htmlBody }
        ]
    };
    // 5. Envía el correo mediante la API REST de SendGrid
    try {
        const response = await (0, node_fetch_1.default)('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${sendgridApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(msg)
        });
        const bodyText = await response.text();
        if (!response.ok) {
            console.error('Error enviando correo de invitación:', response.status, bodyText);
        }
        else {
            console.log(`Invitación enviada a ${tenantEmail}`);
        }
    }
    catch (error) {
        console.error('Excepción al enviar correo de invitación:', error);
    }
    return null;
});
