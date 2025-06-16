import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import fetch from 'node-fetch';

admin.initializeApp();

export const sendContractInvitation = functions.firestore
  .document('contracts/{contractId}')
  .onCreate(async (snap, context) => {
    // lógica de envío de correo...
  });
