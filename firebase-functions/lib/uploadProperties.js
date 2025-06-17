"use strict";
// firebase-functions/src/uploadProperties.ts
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
exports.uploadProperties = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const busboy_1 = __importDefault(require("busboy"));
const stream_1 = require("stream");
exports.uploadProperties = functions.https.onRequest(async (req, res) => {
    // CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    // Preflight
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }
    // 1) Verificar token
    const authHeader = req.headers.authorization || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : null;
    if (!idToken) {
        res.status(401).send({ error: 'Authentication required' });
        return;
    }
    let uid;
    try {
        const decoded = await admin.auth().verifyIdToken(idToken);
        uid = decoded.uid;
    }
    catch (err) {
        console.error('Invalid token', err);
        res.status(401).send({ error: 'Invalid authentication token' });
        return;
    }
    // 2) Parsear el CSV con Busboy
    const busboy = (0, busboy_1.default)({ headers: req.headers });
    const chunks = [];
    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        file.on('data', (data) => {
            chunks.push(data);
        });
    });
    busboy.on('error', (err) => {
        console.error('Busboy error:', err);
        if (!res.headersSent) {
            res.status(500).send({ error: 'Error procesando archivo.', details: err.message });
        }
    });
    busboy.on('finish', async () => {
        const buffer = Buffer.concat(chunks);
        if (!buffer.length) {
            res.status(400).send({ error: 'No file data received.' });
            return;
        }
        const csvString = buffer.toString('utf-8');
        const rows = [];
        const stream = new stream_1.Readable();
        stream.push(csvString);
        stream.push(null);
        stream
            .pipe(require('csv-parser')())
            .on('data', (data) => {
            rows.push(data);
        })
            .on('error', (err) => {
            console.error('CSV parsing error:', err);
            if (!res.headersSent) {
                res.status(500).send({ error: 'Error parseando CSV.', details: err.message });
            }
        })
            .on('end', async () => {
            const results = { successCount: 0, errorCount: 0, errors: [] };
            const valid = [];
            rows.forEach((row, i) => {
                const line = i + 2;
                const errs = [];
                if (!row['Dirección'])
                    errs.push('Dirección es obligatorio.');
                if (!row['estado'])
                    errs.push('estado es obligatorio.');
                if (!row['precio'])
                    errs.push('precio es obligatorio.');
                ['precio', 'área (m2)', 'habitaciones', 'baños'].forEach(f => {
                    if (row[f] && isNaN(Number(row[f]))) {
                        errs.push(`${f} debe ser número (valor: "${row[f]}").`);
                    }
                });
                const estados = ['disponible', 'arrendada', 'mantenimiento'];
                if (row['estado'] && !estados.includes(row['estado'].toLowerCase())) {
                    errs.push('estado inválido. Debe ser disponible, arrendada o mantenimiento.');
                }
                if (errs.length) {
                    results.errorCount++;
                    results.errors.push({ row: line, errors: errs });
                }
                else {
                    valid.push(row);
                }
            });
            const batch = admin.firestore().batch();
            const col = admin.firestore().collection('propiedades');
            valid.forEach(data => {
                const doc = col.doc();
                batch.set(doc, {
                    ...data,
                    precio: Number(data.precio) || 0,
                    'área (m2)': Number(data['área (m2)']) || 0,
                    habitaciones: Number(data.habitaciones) || 0,
                    baños: Number(data.baños) || 0,
                    ownerId: uid,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
            });
            await batch.commit();
            results.successCount = valid.length;
            res.status(200).send({
                message: 'Proceso de carga masiva finalizado.',
                processedResults: results
            });
        });
    });
    busboy.end(req.rawBody);
});
