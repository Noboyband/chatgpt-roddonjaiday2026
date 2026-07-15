const path = require("path");
const QRCode = require("qrcode");

const playUrl = "https://rdj.noboyband.com/play.html";
const output = path.join(__dirname, "..", "public", "assets", "play-qr.png");

QRCode.toFile(output, playUrl, {
  width: 720,
  margin: 2,
  color: { dark: "#111d65", light: "#ffffff" },
  errorCorrectionLevel: "H"
}).then(() => console.log(`QR created for ${playUrl}`));
