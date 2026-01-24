
export class NFCService {
  static isSupported() {
    return 'NDEFReader' in window;
  }

  static async startScan(onMessage: (message: string) => void, onError: (error: any) => void) {
    if (!this.isSupported()) {
      onError(new Error("NFC not supported on this device/browser"));
      return;
    }

    try {
      const ndef = new (window as any).NDEFReader();
      await ndef.scan();
      
      ndef.addEventListener("readingerror", () => {
        onError(new Error("Cannot read data from the NFC tag. Try another one?"));
      });

      ndef.addEventListener("reading", ({ message, serialNumber }: any) => {
        for (const record of message.records) {
          if (record.recordType === "text") {
            const textDecoder = new TextDecoder(record.encoding);
            onMessage(textDecoder.decode(record.data));
          }
        }
      });

      return ndef;
    } catch (error) {
      onError(error);
    }
  }

  static async writeText(text: string) {
    if (!this.isSupported()) {
      throw new Error("NFC not supported on this device/browser");
    }

    try {
      const ndef = new (window as any).NDEFReader();
      await ndef.write(text);
      return true;
    } catch (error) {
      console.error("NFC Write Error:", error);
      throw error;
    }
  }
}
