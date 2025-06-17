// firebase-functions/src/uploadProperties.ts

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Busboy from 'busboy';
import { Readable } from 'stream';

export const uploadProperties = functions.https.onRequest(async (req, res): Promise<void> => {
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

  let uid: string;
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    uid = decoded.uid;
  } catch (err: any) {
    console.error('Invalid token', err);
    res.status(401).send({ error: 'Invalid authentication token' });
    return;
  }

  // 2) Parsear el CSV con Busboy
  const busboy = Busboy({ headers: req.headers });
  const chunks: Buffer[] = [];

  busboy.on('file', (fieldname: string, file: NodeJS.ReadableStream, filename: string, encoding: string, mimetype: string) => {
    file.on('data', (data: Buffer) => {
      chunks.push(data);
    });
  });

  busboy.on('error', (err: any) => {
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
    const rows: any[] = [];
    const stream = new Readable();
    stream.push(csvString);
    stream.push(null);

    stream
      .pipe(require('csv-parser')())
      .on('data', (data: any) => {
        rows.push(data);
      })
      .on('error', (err: any) => {
        console.error('CSV parsing error:', err);
        if (!res.headersSent) {
          res.status(500).send({ error: 'Error parseando CSV.', details: err.message });
        }
      })
      .on('end', async () => {
        const results = { successCount: 0, errorCount: 0, errors: [] as any[] };
        const valid: any[] = [];

        rows.forEach((row, i) => {
          const line = i + 2;
          const errs: string[] = [];

          if (!row['Dirección']) errs.push('Dirección es obligatorio.');
          if (!row['estado']) errs.push('estado es obligatorio.');
          if (!row['precio']) errs.push('precio es obligatorio.');

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
          } else {
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
