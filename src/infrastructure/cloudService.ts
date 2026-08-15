export async function uploadPdfToCloudinary(
  pdfBlob: Blob,
  filename: string,
  onProgress?: (percent: number) => void
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    try {
      const cloudName = 'dph4vgw0a';
      const uploadPreset = 'unsigned_pdf_preset';
      const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

      const xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          onProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          try {
            const res = JSON.parse(xhr.responseText);
            const secureUrl = res.secure_url || res.url;
            resolve({
              url: secureUrl,
              publicId: res.public_id
            });
          } catch (parseErr) {
            reject(parseErr);
          }
        } else {
          reject(new Error(`Lỗi upload Cloudinary: HTTP ${xhr.status} - ${xhr.responseText}`));
        }
      };

      xhr.onerror = () => reject(new Error('Lỗi mạng khi tải file lên Cloudinary'));

      const formData = new FormData();
      formData.append('file', pdfBlob, filename);
      formData.append('upload_preset', uploadPreset);

      xhr.send(formData);
    } catch (err) {
      reject(err);
    }
  });
}
