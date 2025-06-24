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
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateContractPDF = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const date_fns_1 = require("date-fns");
const locale_1 = require("date-fns/locale");
const db = admin.firestore();
const formatDate = (date) => (0, date_fns_1.format)(date, "d 'de' MMMM 'de' yyyy", { locale: locale_1.es });
function getContractTemplate(data) {
    const { landlordName, landlordRut, tenantName, tenantRut, propertyAddress, propertyComuna, rentAmount, rentAmountText, startDate, endDate, paymentDay, securityDepositAmount, securityDepositAmountText, } = data;
    return `
CONTRATO DE ARRENDAMIENTO

En Santiago de Chile, a ${formatDate(new Date())}, entre:

DON/DOÑA ${landlordName || "[NOMBRE ARRENDADOR]"}, de nacionalidad chilena, cédula de identidad N° ${landlordRut || "[RUT ARRENDADOR]"}, en adelante "el Arrendador"; y

DON/DOÑA ${tenantName || "[NOMBRE ARRENDATARIO]"}, de nacionalidad chilena, cédula de identidad N° ${tenantRut || "[RUT ARRENDATARIO]"}, en adelante "el Arrendatario";

Se ha convenido en el siguiente contrato de arrendamiento:

PRIMERO: El Arrendador da en arrendamiento al Arrendatario, quien acepta para sí, la propiedad ubicada en ${propertyAddress || "[DIRECCIÓN PROPIEDAD]"}, comuna de ${propertyComuna || "[COMUNA]"}, ciudad de Santiago.

SEGUNDO: La renta mensual de arrendamiento será la suma de $${rentAmount ? rentAmount.toLocaleString('es-CL') : "[MONTO]"} (${rentAmountText || "[MONTO EN PALABRAS]"}), que se pagará por anticipado dentro de los primeros ${paymentDay || "5"} días de cada mes.

TERCERO: El presente contrato de arrendamiento comenzará a regir a contar del día ${startDate ? formatDate(new Date(startDate)) : "[FECHA INICIO]"} y terminará el día ${endDate ? formatDate(new Date(endDate)) : "[FECHA FIN]"}.

CUARTO: El Arrendatario entrega en este acto al Arrendador la suma de $${securityDepositAmount ? securityDepositAmount.toLocaleString('es-CL') : "[MONTO GARANTÍA]"} (${securityDepositAmountText || "[MONTO GARANTÍA EN PALABRAS]"}) por concepto de garantía, la cual será devuelta al término del contrato, una vez verificado el estado de la propiedad y el pago de todas las cuentas de servicios básicos.

QUINTO: El Arrendatario se obliga a mantener la propiedad en perfecto estado de conservación y a pagar puntualmente las cuentas de servicios básicos como luz, agua, gas y gastos comunes.

SEXTO: Para todos los efectos legales, las partes fijan su domicilio en la comuna y ciudad de Santiago.

En comprobante y previa lectura, firman las partes en dos ejemplares de igual tenor.


_________________________
${landlordName || "ARRENDADOR"}
RUT: ${landlordRut || "RUT ARRENDADOR"}


_________________________
${tenantName || "ARRENDATARIO"}
RUT: ${tenantRut || "RUT ARRENDATARIO"}
  `;
}
exports.generateContractPDF = functions.firestore
    .document("contracts/{contractId}")
    .onCreate(async (snap) => {
    // ... (el resto de la función es la misma)
    // ...
});
