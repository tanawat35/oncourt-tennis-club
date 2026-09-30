// PromptPay (Thai QR, EMVCo) payload + QR image
import QRCode from 'qrcode';

const f = (id, v) => id + String(v.length).padStart(2, '0') + v;

function crc16(s) {
  let crc = 0xffff;
  for (let i = 0; i < s.length; i++) {
    crc ^= s.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function promptpayPayload(id, amount) {
  const digits = String(id).replace(/\D/g, '');
  const target = digits.length >= 13
    ? f('02', digits) // national ID / tax ID
    : f('01', ('0000000000000' + '66' + digits.replace(/^0/, '')).slice(-13)); // phone → 0066XXXXXXXXX
  let p = f('00', '01') + f('01', amount ? '12' : '11') + f('29', f('00', 'A000000677010111') + target) + f('58', 'TH') + f('53', '764');
  if (amount) p += f('54', Number(amount).toFixed(2));
  p += '6304';
  return p + crc16(p);
}

export async function promptpayQR(id, amount) {
  return QRCode.toDataURL(promptpayPayload(id, amount), { margin: 1, width: 360, color: { dark: '#0a1020', light: '#ffffff' } });
}
