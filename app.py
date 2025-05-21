from flask import Flask, request, send_file, render_template, Response
from Crypto.Cipher import AES
from Crypto.Protocol.KDF import PBKDF2
from Crypto.Random import get_random_bytes
from Crypto.Util.Padding import pad, unpad
import os
from io import BytesIO

app = Flask(__name__)

def derive_key(password, salt):
    return PBKDF2(password.encode(), salt, dkLen=32, count=100000)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/encrypt', methods=['POST'])
def encrypt():
    if 'file' not in request.files or not request.form.get('key'):
        return Response("Thiếu file hoặc khóa!", status=400)

    file = request.files['file']
    key = request.form['key']
    data = file.read()

    # Generate salt and IV
    salt = get_random_bytes(16)
    iv = get_random_bytes(16)
    aes_key = derive_key(key, salt)

    # Encrypt
    cipher = AES.new(aes_key, AES.MODE_CBC, iv)
    padded_data = pad(data, AES.block_size)
    ciphertext = cipher.encrypt(padded_data)

    # Combine salt, IV, and ciphertext
    encrypted_data = salt + iv + ciphertext

    # Prepare file for download
    output = BytesIO(encrypted_data)
    output.seek(0)
    return send_file(
        output,
        as_attachment=True,
        download_name=f"{file.filename}.enc",
        mimetype='application/octet-stream'
    )

@app.route('/decrypt', methods=['POST'])
def decrypt():
    if 'file' not in request.files or not request.form.get('key'):
        return Response("Thiếu file hoặc khóa!", status=400)

    file = request.files['file']
    key = request.form['key']
    encrypted_data = file.read()

    # Check if file is too short to contain salt, IV, and ciphertext
    if len(encrypted_data) < 32:
        return Response("File mã hóa không hợp lệ!", status=400)

    # Extract salt, IV, and ciphertext
    salt = encrypted_data[:16]
    iv = encrypted_data[16:32]
    ciphertext = encrypted_data[32:]

    try:
        # Derive key and decrypt
        aes_key = derive_key(key, salt)
        cipher = AES.new(aes_key, AES.MODE_CBC, iv)
        padded_data = cipher.decrypt(ciphertext)
        plaintext = unpad(padded_data, AES.block_size)

        # Prepare file for download
        output = BytesIO(plaintext)
        output.seek(0)
        return send_file(
            output,
            as_attachment=True,
            download_name=file.filename.replace('.enc', ''),
            mimetype='application/octet-stream'
        )
    except ValueError as e:
        return Response("Giải mã thất bại! Vui lòng kiểm tra khóa!", status=400)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)