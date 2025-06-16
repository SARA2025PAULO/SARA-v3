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
exports.passwordRecovery = void 0;
// firebase-functions/src/passwordRecovery.ts
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const mail_1 = __importDefault(require("@sendgrid/mail"));
mail_1.default.setApiKey(functions.config().sendgrid.key);
exports.passwordRecovery = functions.https.onRequest(async (req, res) => {
    console.log('passwordRecovery function started');
    const email = req.body.email;
    const sendgridAPIKey = functions.config().sendgrid.key;
    console.log('SendGrid API Key exists:', !!sendgridAPIKey); // Log if key is present
    console.log('Received email:', email);
    if (!email) {
        res.status(400).send({ error: 'El campo "email" es obligatorio.' });
    }
    try {
        const user = await admin.auth().getUserByEmail(email);
        // Generate the password reset link and explicitly set the language to Spanish
        let link = await admin.auth().generatePasswordResetLink(email, {
            url: 'https://sara3o.firebaseapp.com/__/auth/action', // optional: custom URL
            handleCodeInApp: true
        });
        console.log('Generated link (before replace):', link);
        // Modify the link to ensure lang=es
        link = link.replace('lang=en', 'lang=es');
        console.log('Modified link (after replace):', link);
        const msg = {
            to: email,
            from: 'notificaciones@sarachile.com',
            subject: 'Recuperación de contraseña SARA',
            text: `
Hola ${user.displayName || 'Usuario'},

Has solicitado restablecer tu contraseña en SARA.
Por favor, haz clic en el siguiente enlace para elegir una nueva contraseña:

${link}

Si no solicitaste este cambio, puedes ignorar este mensaje.

¡Saludos,
El equipo de SARA!
      `.trim(),
            html: `
 <p>Hola <strong>${user.displayName || 'Usuario'}</strong>,</p>
 <p>Has solicitado restablecer tu contraseña en <strong>SARA</strong>.</p>
 <p><a href="${link}">Restablecer contraseña</a></p>
 <p>Si no solicitaste este cambio de contraseña, puedes ignorar este mensaje.</p>
 <p>¡Saludos,<br/>El equipo de SARA!</p>
      `
        };
        await mail_1.default.send(msg);
        res.send({ success: true });
    }
    catch (err) {
        console.error('Error en passwordRecovery:', err);
        if (err.code === 'auth/user-not-found') {
            res.status(404).send({ error: 'No existe un usuario con ese correo.' });
        }
        res.status(500).send({ error: err.message });
    }
});
