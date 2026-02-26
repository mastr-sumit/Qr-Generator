// ── Tab switching ──
let activeTab = 'url';

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    activeTab = btn.dataset.tab;
    document.getElementById('panel-' + activeTab).classList.add('active');
  });
});

// ── Color pickers ──
function updateColorVal(inputId, spanId) {
  document.getElementById(spanId).textContent = document.getElementById(inputId).value.toUpperCase();
}

// ── Logo upload ──
let logoDataUrl = null;

function handleLogoUpload(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  const reader = new FileReader();
  reader.onload = e => {
    logoDataUrl = e.target.result;
    document.getElementById('logo-thumb').src = logoDataUrl;
    document.getElementById('logo-name').textContent = file.name;
    document.getElementById('logo-preview').classList.add('show');
  };
  reader.readAsDataURL(file);
}

function removeLogo() {
  logoDataUrl = null;
  document.getElementById('logo-file').value = '';
  document.getElementById('logo-preview').classList.remove('show');
}

// ── Build QR data strings ──
function buildQRData() {
  switch (activeTab) {
    case 'url': {
      const v = document.getElementById('url-input').value.trim();
      if (!v) { showToast('Please enter a URL'); return null; }
      return v;
    }
    case 'text': {
      const v = document.getElementById('text-input').value.trim();
      if (!v) { showToast('Please enter some text'); return null; }
      return v;
    }
    case 'wifi': {
      const ssid = document.getElementById('wifi-ssid').value.trim();
      if (!ssid) { showToast('Please enter the network name'); return null; }
      const pass   = document.getElementById('wifi-pass').value;
      const sec    = document.getElementById('wifi-sec').value;
      const hidden = document.getElementById('wifi-hidden').checked ? 'true' : 'false';
      return `WIFI:T:${sec};S:${ssid};P:${pass};H:${hidden};;`;
    }
    case 'contact': {
      const first = document.getElementById('con-first').value.trim();
      const last  = document.getElementById('con-last').value.trim();
      if (!first && !last) { showToast('Please enter at least a name'); return null; }
      const phone = document.getElementById('con-phone').value.trim();
      const email = document.getElementById('con-email').value.trim();
      const org   = document.getElementById('con-org').value.trim();
      const web   = document.getElementById('con-web').value.trim();
      let vcard = `BEGIN:VCARD\nVERSION:3.0\nN:${last};${first};;;\nFN:${first} ${last}`.trim();
      if (org)   vcard += `\nORG:${org}`;
      if (phone) vcard += `\nTEL:${phone}`;
      if (email) vcard += `\nEMAIL:${email}`;
      if (web)   vcard += `\nURL:${web}`;
      vcard += '\nEND:VCARD';
      return vcard;
    }
  }
}

// ── Generate ──
let lastData = null;

function generateQR() {
  const data = buildQRData();
  if (!data) return;
  lastData = data;
  renderQR(data);
}

function regenerateQR() {
  if (lastData) renderQR(lastData);
}

function renderQR(data) {
  const wrap = document.getElementById('qr-canvas-wrap');
  wrap.innerHTML = '';
  wrap.classList.remove('qr-appear');
  void wrap.offsetWidth; // reflow to restart animation

  const size    = parseInt(document.getElementById('qr-size').value);
  const fgColor = document.getElementById('qr-fg').value;
  const bgColor = document.getElementById('qr-bg').value;
  const ecLevel = document.getElementById('qr-ec').value;
  const ecMap   = {
    L: QRCode.CorrectLevel.L,
    M: QRCode.CorrectLevel.M,
    Q: QRCode.CorrectLevel.Q,
    H: QRCode.CorrectLevel.H
  };

  new QRCode(wrap, {
    text: data,
    width: size,
    height: size,
    colorDark: fgColor,
    colorLight: bgColor,
    correctLevel: ecMap[ecLevel]
  });

  if (logoDataUrl) {
    setTimeout(() => overlayLogo(wrap, size), 80);
  }

  wrap.classList.add('qr-appear');

  document.getElementById('qr-placeholder').style.display = 'none';
  document.getElementById('qr-output').classList.add('show');

  const tabNames = { url: 'URL', text: 'Plain Text', wifi: 'Wi-Fi', contact: 'Contact Card' };
  document.getElementById('qr-type-label').textContent = tabNames[activeTab];
}

function overlayLogo(wrap, size) {
  const canvas = wrap.querySelector('canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const img = new Image();
  img.onload = () => {
    const logoSize = size * 0.22;
    const x = (size - logoSize) / 2;
    const y = (size - logoSize) / 2;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, logoSize * 0.66, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.drawImage(img, x, y, logoSize, logoSize);
  };
  img.src = logoDataUrl;
}

// ── Download ──
function downloadQR() {
  const canvas = document.querySelector('#qr-canvas-wrap canvas');
  if (!canvas) { showToast('Generate a QR code first'); return; }
  const a = document.createElement('a');
  a.download = 'qrcraft-code.png';
  a.href = canvas.toDataURL('image/png');
  a.click();
  showToast('Downloaded!');
}

// ── Copy to clipboard ──
async function copyQR() {
  const canvas = document.querySelector('#qr-canvas-wrap canvas');
  if (!canvas) { showToast('Generate a QR code first'); return; }
  try {
    canvas.toBlob(async blob => {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      showToast('Copied to clipboard!');
    });
  } catch {
    showToast('Could not copy — try downloading instead');
  }
}

// ── Toast ──
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2500);
}

// ── Ctrl+Enter shortcut ──
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.ctrlKey) generateQR();
});
