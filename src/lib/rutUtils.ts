// src/lib/rutUtils.ts

/**
 * Formats a RUT string (Chilean national ID) into a standardized format.
 * Example: "123456789" -> "12.345.678-9"
 * @param rut The raw RUT string.
 * @returns The formatted RUT string.
 */
export const formatRut = (rut: string): string => {
  let cleanRut = rut.replace(/[^0-9kK]/g, "").toUpperCase();
  if (!cleanRut) return "";

  let body = cleanRut.slice(0, -1);
  let verifier = cleanRut.slice(-1);

  if (body.length > 0) {
    body = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${body}-${verifier}`;
  } else {
    // Allows typing the first digit of the verifier without a leading hyphen
    return verifier;
  }
};

/**
 * Removes formatting from a RUT string.
 * Example: "12.345.678-9" -> "123456789"
 * @param formattedRut The formatted RUT string.
 * @returns The clean, unformatted RUT string.
 */
export const cleanRut = (formattedRut: string): string => {
  return formattedRut.replace(/[\.\-]/g, "");
};

/**
 * Validates a Chilean RUT. Now correctly handles formatted RUTs.
 * @param rut The RUT string (can be formatted or not).
 * @returns True if the RUT is valid, false otherwise.
 */
export const validateRut = (rut: string): boolean => {
  if (!rut) return false;
  
  const clean = rut.replace(/[\.\-]/g, "").toUpperCase();
  const body = clean.slice(0, -1);
  const verifier = clean.slice(-1);

  if (!/^[0-9]+[0-9K]$/.test(clean) || body.length < 7) {
      return false;
  }

  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body.charAt(i), 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const calculatedVerifier = 11 - (sum % 11);
  let expectedVerifier: string;

  if (calculatedVerifier === 11) {
    expectedVerifier = "0";
  } else if (calculatedVerifier === 10) {
    expectedVerifier = "K";
  } else {
    expectedVerifier = calculatedVerifier.toString();
  }

  return verifier === expectedVerifier;
};
