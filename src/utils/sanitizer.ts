import { SensitiveDetectionResult } from '../types';

/**
 * Checks text for potentially sensitive data:
 * - Classified / CUI markings
 * - SSN (Social Security Number)
 * - DoD ID / EDIPI
 * - Financial account numbers or credit cards
 * - Protected Health Information (PHI)
 * 
 * Rules: Never repeat or echo the detected sensitive content back to the user.
 */
export function detectSensitiveData(text: string): SensitiveDetectionResult {
  if (!text || typeof text !== 'string') {
    return { isSensitive: false, detectedTypes: [], warningMessage: '' };
  }

  const detected: string[] = [];

  // 1. Classified & CUI markings
  const classifiedRegex = /\b(TOP\s+SECRET|SECRET|CONFIDENTIAL|CUI|CONTROLLED\s+UNCLASSIFIED|NOFORN|REL\s+TO|ORCON|FGI|SI\/TK|COMINT|HCS|FOUO|FOR\s+OFFICIAL\s+USE\s+ONLY|SCI\/TK)\b/i;
  if (classifiedRegex.test(text)) {
    detected.push('Classified / CUI / Caveat markings');
  }

  // 2. SSN patterns (e.g. 000-00-0000 or 9-digit with ssn keyword)
  const ssnRegex = /\b(?:\d{3}-\d{2}-\d{4}|\bSSN\s*[:#]?\s*\d{3}[- ]?\d{2}[- ]?\d{4})\b/i;
  if (ssnRegex.test(text)) {
    detected.push('Social Security Number (SSN)');
  }

  // 3. DoD ID / EDIPI patterns (10-digit number tagged with DOD ID or EDIPI)
  const dodIdRegex = /\b(?:EDIPI|DOD\s*ID|DODID)\s*[:#]?\s*\d{10}\b/i;
  if (dodIdRegex.test(text)) {
    detected.push('DoD ID / EDIPI');
  }

  // 4. Financial data (Credit cards, bank routing numbers)
  const ccRegex = /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12})\b/;
  const bankRegex = /\b(?:routing\s*number|bank\s*account|account\s*#|cvv\s*[:#]?\s*\d{3,4})\b/i;
  if (ccRegex.test(text) || bankRegex.test(text)) {
    detected.push('Personal Financial Information');
  }

  // 5. PHI (Protected Health Information / Medical Diagnosis)
  const phiRegex = /\b(?:medical\s+record|psychiatric\s+eval|mental\s+health\s+treatment|suicide\s+watch|prescription\s+for|diagnosed\s+with\s+[a-z]+|HIPAA\s+protected)\b/i;
  if (phiRegex.test(text)) {
    detected.push('Protected Health Information (PHI)');
  }

  const isSensitive = detected.length > 0;
  let warningMessage = '';

  if (isSensitive) {
    warningMessage = `Sanitization Required: The input appears to contain potential ${detected.join(', ')}. In accordance with OPSEC and privacy directives, do not enter classified, CUI, SSN, DoD ID, PHI, or personal financial data. Please sanitize your notes first before generating statements.`;
  }

  return {
    isSensitive,
    detectedTypes: detected,
    warningMessage
  };
}
