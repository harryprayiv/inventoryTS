declare class QRCode {
  constructor(element: HTMLElement, options: string | QRCode.QRCodeOptions);
}

declare namespace QRCode {
  interface QRCodeOptions {
    text?: string;
    width?: number;
    height?: number;
    colorDark?: string;
    colorLight?: string;
    correctLevel?: number;
  }
}