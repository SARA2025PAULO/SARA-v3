
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
