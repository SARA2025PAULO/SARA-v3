
export const formatRut = (rut: string): string => {
  if (!rut || typeof rut !== 'string') {
    return '';
  }

  // Limpiar el RUT de puntos y guion
  let cleanRut = rut.replace(/[.-]/g, '');

  if (cleanRut.length < 2) {
    return cleanRut;
  }

  // Separar el cuerpo del dígito verificador
  let body = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1).toUpperCase();

  // Formatear el cuerpo con puntos
  body = new Intl.NumberFormat('es-CL').format(Number(body));

  return `${body}-${dv}`;
};

export const cleanRut = (rut: string): string => {
    if (!rut || typeof rut !== 'string') {
        return '';
    }
    return rut.replace(/[.-]/g, '');
}

export const validateRut = (rut: string): boolean => {
    if (!rut || typeof rut !== 'string') {
        return false;
    }

    const cleanedRut = cleanRut(rut);
    if (cleanedRut.length < 2) {
        return false;
    }

    let rutBody = cleanedRut.slice(0, -1);
    const dv = cleanedRut.slice(-1).toUpperCase();

    // Validar formato del cuerpo
    if (!/^[0-9]+$/.test(rutBody)) {
        return false;
    }

    let sum = 0;
    let multiplier = 2;

    for (let i = rutBody.length - 1; i >= 0; i--) {
        sum += parseInt(rutBody.charAt(i), 10) * multiplier;
        multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }

    const calculatedDv = 11 - (sum % 11);
    let expectedDv: string;

    if (calculatedDv === 11) {
        expectedDv = '0';
    } else if (calculatedDv === 10) {
        expectedDv = 'K';
    } else {
        expectedDv = calculatedDv.toString();
    }

    return dv === expectedDv;
};
