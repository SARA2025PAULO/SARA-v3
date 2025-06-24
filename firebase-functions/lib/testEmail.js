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
exports.testEmail = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const axios_1 = __importDefault(require("axios"));
if (admin.apps.length === 0) {
    admin.initializeApp();
}
exports.testEmail = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'La función debe ser llamada por un usuario autenticado.');
    }
    const userEmail = context.auth.token.email;
    if (!userEmail) {
        throw new functions.https.HttpsError('invalid-argument', 'No se pudo obtener el correo del usuario autenticado.');
    }
    const sendgridApiKey = functions.config().sendgrid?.key;
    if (!sendgridApiKey) {
        console.error("FATAL: La API Key de SendGrid no está configurada.");
        throw new functions.https.HttpsError('internal', 'El servicio de correo no está configurado.');
    }
    const msg = {
        personalizations: [{
                to: [{ email: userEmail }]
            }],
        from: {
            name: "Prueba S.A.R.A.",
            email: "notificaciones@sarachile.com"
        },
        subject: `Prueba de correo desde S.A.R.A. - ${new Date().toISOString()}`,
        content: [
            {
                type: 'text/plain',
                value: 'Si recibes este correo, la configuración de SendGrid y la función de prueba están funcionando.'
            },
            {
                type: 'text/html',
                value: '<h1>¡Hola!</h1><p>Si recibes este correo, la configuración de SendGrid y la función de prueba están funcionando.</p>'
            }
        ]
    };
    try {
        await axios_1.default.post('https://api.sendgrid.com/v3/mail/send', msg, {
            headers: {
                'Authorization': `Bearer ${sendgridApiKey}`,
                'Content-Type': 'application/json',
            },
        });
        console.log(`Correo de prueba enviado exitosamente a ${userEmail}.`);
        return { success: true, message: `Correo de prueba enviado a ${userEmail}` };
    }
    catch (error) {
        if (error.response) {
            console.error(`Error al enviar correo de prueba a ${userEmail}: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
            throw new functions.https.HttpsError('internal', `Error de SendGrid: ${error.response.status} ${JSON.stringify(error.response.data)}`);
        }
        else {
            console.error('Excepción al enviar correo de prueba:', error);
            throw new functions.https.HttpsError('internal', 'Ocurrió una excepción inesperada al enviar el correo.');
        }
    }
});
