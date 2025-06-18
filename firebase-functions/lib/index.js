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
exports.uploadProperties = exports.passwordRecovery = exports.sendContractInvitation = exports.testEmailRest = exports.helloWorld = void 0;
// firebase-functions/src/index.ts
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const passwordRecovery_1 = require("./passwordRecovery");
Object.defineProperty(exports, "passwordRecovery", { enumerable: true, get: function () { return passwordRecovery_1.passwordRecovery; } });
const uploadProperties_1 = require("./uploadProperties");
Object.defineProperty(exports, "uploadProperties", { enumerable: true, get: function () { return uploadProperties_1.uploadProperties; } });
const sendContractInvitation_1 = require("./sendContractInvitation");
Object.defineProperty(exports, "sendContractInvitation", { enumerable: true, get: function () { return sendContractInvitation_1.sendContractInvitation; } });
admin.initializeApp();
// 0. Función de prueba mínima para aislar problemas de despliegue
exports.helloWorld = functions.https.onRequest((req, res) => {
    res.send('¡Hola Mundo!');
});
// 1. Función de prueba HTTP usando la API REST de SendGrid
exports.testEmailRest = functions.https.onRequest(async (req, res) => {
    const sendgridApiKey = functions.config().sendgrid?.key;
    if (!sendgridApiKey) {
        console.error('SendGrid API key not configured.');
        res.status(500).send('SendGrid API key not configured.');
        return;
    }
    const msg = {
        personalizations: [{ to: [{ email: 'destinatario@ejemplo.com' }] }],
        from: { email: 'notificaciones@sarachile.com' },
        subject: 'Prueba vía REST desde Firebase',
        content: [{ type: 'text/plain', value: '¡Hola desde REST API!' }],
    };
    try {
        console.log('SendGrid API Key (partial):', sendgridApiKey.substring(0, 5) + '...');
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
        if (response.ok) {
            console.log('Correo REST enviado con éxito (testEmailRest)');
            res.status(200).send('Correo REST enviado con éxito (testEmailRest)');
        }
        else {
            console.error(`Error enviando correo REST: ${response.status} - ${responseBody}`);
            res.status(500).send('Error enviando correo REST');
        }
    }
    catch (error) {
        console.error('Error in testEmailRest function:', error);
        res.status(500).send('Error en testEmailRest');
    }
});
