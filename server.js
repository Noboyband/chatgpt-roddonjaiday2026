const express = require("express");
const http = require("http");
const os = require("os");
const path = require("path");
const QRCode = require("qrcode");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = Number(process.env.PORT) || 3000;
const clients = new Map();
let totalHearts = 0;

app.use(express.static(path.join(__dirname, "public")));

app.get("/qr", async (req, res) => {
  try {
    const url = `${req.protocol}://${req.get("host")}/play`;
    const png = await QRCode.toBuffer(url, {
      width: 720,
      margin: 2,
      color: { dark: "#132f35", light: "#ffffff" },
      errorCorrectionLevel: "H"
    });
    res.type("png").send(png);
  } catch (error) {
    res.status(500).send("Unable to create QR code");
  }
});

app.get("/play", (_req, res) => res.sendFile(path.join(__dirname, "public", "play.html")));

io.on("connection", (socket) => {
  socket.emit("total", totalHearts);

  socket.on("join-player", (deviceId) => {
    if (typeof deviceId !== "string" || deviceId.length > 80) return;
    socket.data.deviceId = deviceId;
    socket.emit("player-count", clients.get(deviceId) || 0);
  });

  socket.on("heart", (payload = {}) => {
    const deviceId = socket.data.deviceId;
    if (!deviceId) return;
    const count = clients.get(deviceId) || 0;
    if (count >= 100) {
      socket.emit("limit");
      return;
    }

    const nextCount = count + 1;
    clients.set(deviceId, nextCount);
    totalHearts += 1;
    socket.emit("player-count", nextCount);
    io.emit("heart", {
      total: totalHearts,
      hue: Number(payload.hue) || Math.floor(Math.random() * 360),
      x: Math.min(94, Math.max(6, Number(payload.x) || 50))
    });
  });

  socket.on("reset-stage", () => {
    totalHearts = 0;
    clients.clear();
    io.emit("reset");
  });
});

function localAddresses() {
  const found = [];
  for (const entries of Object.values(os.networkInterfaces())) {
    for (const entry of entries || []) {
      if (entry.family === "IPv4" && !entry.internal) found.push(`http://${entry.address}:${port}`);
    }
  }
  return found;
}

server.listen(port, "0.0.0.0", () => {
  console.log(`Stage: http://localhost:${port}`);
  for (const address of localAddresses()) console.log(`Network: ${address}`);
});
