import service from './request';

//interface to generate QR code key
export function getQrCode() {
  return service.get('/login/qr/key?timestamp=' + new Date().getTime());
}
// generate QR code image
export function getQrCodeImg(key:string) {
  return service.get(`/login/qr/create?key=${key}&timestamp=${new Date().getTime()}&qrimg=true`);
}
// fetch QR code status
export function getQrCodeStatus(key:string) {
  return service.get(`/login/qr/check?key=${key}&timestamp=${new Date().getTime()}`);
}
// logout
export function logout() {
  return service.get('/logout?timestamp=' + new Date().getTime());
}