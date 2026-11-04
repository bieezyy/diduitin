/**
 * Kompresi gambar langsung di browser menggunakan HTML Canvas
 * Merampingkan dimensi maksimal ke 800px dan mengonversi ke JPEG (kualitas ~0.7)
 * Menghasilkan string Base64 ringan (~80KB - 150KB) yang aman disimpan di IndexedDB
 */
export async function compressReceiptImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = event => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Gagal inisialisasi context canvas'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Kompresi ke format JPEG kualitas 0.72 (sangat tajam untuk teks struk tapi file kecil)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.72);
        resolve(compressedBase64);
      };
      img.onerror = error => reject(error);
    };
    reader.onerror = error => reject(error);
  });
}
