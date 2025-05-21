const fileInput = document.getElementById('fileInput');
const keyInput = document.getElementById('keyInput');
const dropZone = document.getElementById('dropZone');
const fileText = document.getElementById('fileText');
const encryptBtn = document.getElementById('encryptBtn');
const decryptBtn = document.getElementById('decryptBtn');
const status = document.getElementById('status');
const downloadSection = document.getElementById('downloadSection');
const downloadMessage = document.getElementById('downloadMessage');
const downloadLink = document.getElementById('downloadLink');

// Drag and drop functionality
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  fileInput.files = e.dataTransfer.files;
  fileText.textContent = fileInput.files[0]?.name || 'Nhấn để chọn file hoặc kéo thả tại đây';
});

fileInput.addEventListener('change', () => {
  fileText.textContent = fileInput.files[0]?.name || 'Nhấn để chọn file hoặc kéo thả tại đây';
});

async function processFile(endpoint) {
  const file = fileInput.files[0];
  const key = keyInput.value;
  if (!file || !key) {
    status.textContent = 'Vui lòng chọn file và nhập khóa!';
    downloadSection.classList.add('hidden');
    return;
  }

  status.textContent = 'Đang xử lý...';
  const formData = new FormData();
  formData.append('file', file);
  formData.append('key', key);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text(); // Lấy thông báo lỗi từ backend
      throw new Error(errorText || 'Xử lý thất bại!');
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const filename = response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] || 'processed_file';

    // Hiển thị nút Download
    downloadMessage.textContent = `${endpoint === '/encrypt' ? 'Mã hóa' : 'Giải mã'} thành công! Nhấn nút dưới để tải file: ${filename}`;
    downloadLink.href = url;
    downloadLink.download = filename;
    downloadSection.classList.remove('hidden');
    status.textContent = '';

    // Dọn dẹp URL khi trang được unload để tránh rò rỉ bộ nhớ
    window.addEventListener('unload', () => URL.revokeObjectURL(url), { once: true });
  } catch (error) {
    status.textContent = endpoint === '/encrypt' ? `Mã hóa thất bại! ${error.message}` : `Giải mã thất bại! ${error.message}`;
    downloadSection.classList.add('hidden');
  }
}

encryptBtn.addEventListener('click', () => processFile('/encrypt'));
decryptBtn.addEventListener('click', () => processFile('/decrypt'));