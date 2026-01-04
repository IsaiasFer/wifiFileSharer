import { createServer } from "http";
import { parse } from "url";
import next from "next";
import express, { Request, Response } from "express";
import { Server } from "socket.io";
import ip from "ip";
import formidable from "formidable";
import fs from "fs";
import path from "path";
import { setupSocket } from "./lib/socket";
import { addFileToRoom, getRoom } from "./lib/rooms";
import { SharedFile } from "./lib/types";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();
  const httpServer = createServer(server);
  const io = new Server(httpServer);

  // Setup Socket.io events
  setupSocket(io);
  (global as any).io = io;

  // Upload Endpoint
  server.post("/api/upload", (req: Request, res: Response) => {
    // First, parse with a high limit to get the file, then validate against room settings
    const form = formidable({
      uploadDir: "/tmp",
      keepExtensions: true,
      maxFileSize: 500 * 1024 * 1024, // Server max: 500MB
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error("Upload error:", err);
        res.status(500).json({ error: "Upload failed" });
        return;
      }

      const roomId = Array.isArray(fields.roomId) ? fields.roomId[0] : fields.roomId;
      const senderId = Array.isArray(fields.senderId) ? fields.senderId[0] : fields.senderId;
      const senderName = Array.isArray(fields.senderName) ? fields.senderName[0] : fields.senderName;

      const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;

      if (!roomId || !uploadedFile) {
        res.status(400).json({ error: "Missing fields" });
        return;
      }

      // Verify room exists
      const room = getRoom(roomId);
      if (!room) {
        fs.unlinkSync(uploadedFile.filepath);
        res.status(404).json({ error: "Room not found" });
        return;
      }

      // Validate file size against room settings
      if (uploadedFile.size > room.settings.maxFileSize) {
        fs.unlinkSync(uploadedFile.filepath);
        const maxMB = Math.round(room.settings.maxFileSize / 1024 / 1024);
        res.status(413).json({ error: `Archivo demasiado grande. Máximo: ${maxMB}MB` });
        return;
      }

      const sharedFile: SharedFile = {
        id: uploadedFile.newFilename,
        name: uploadedFile.originalFilename || "unknown",
        size: uploadedFile.size,
        type: uploadedFile.mimetype || "application/octet-stream",
        senderId: senderId || "unknown",
        senderName: senderName || "Anonymous",
        path: uploadedFile.filepath,
        createdAt: Date.now(),
      };

      addFileToRoom(roomId, sharedFile);

      // Notify room
      io.to(roomId).emit("file_uploaded", sharedFile);
      io.to(roomId).emit("room_updated", getRoom(roomId));

      res.json({ success: true, file: sharedFile });
    });
  });

  // Download Endpoint
  server.get("/api/download/:fileId", (req: Request, res: Response) => {
    const { fileId } = req.params;
    const { roomId } = req.query;

    const room = getRoom(roomId as string);
    if (!room) {
      res.status(404).send("Room not found");
      return;
    }

    const file = room.files.find(f => f.id === fileId);
    if (!file || !fs.existsSync(file.path)) {
      res.status(404).send("File not found or expired");
      return;
    }

    res.download(file.path, file.name);
  });

  // Preview Endpoint (for images)
  server.get("/api/preview/:fileId", (req: Request, res: Response) => {
    const { fileId } = req.params;
    const { roomId } = req.query;

    const room = getRoom(roomId as string);
    if (!room) {
      res.status(404).send("Room not found");
      return;
    }

    const file = room.files.find(f => f.id === fileId);
    if (!file || !fs.existsSync(file.path)) {
      res.status(404).send("File not found");
      return;
    }

    // Only serve images
    if (!file.type.startsWith("image/")) {
      res.status(400).send("Not an image");
      return;
    }

    // Send the image file directly
    res.setHeader("Content-Type", file.type);
    res.setHeader("Cache-Control", "public, max-age=3600");
    fs.createReadStream(file.path).pipe(res);
  });

  // Handle all other routes with Next.js (Express 5 fix)
  server.all(/(.*)/, (req: Request, res: Response) => {
    const parsedUrl = parse(req.url!, true);
    handle(req as any, res as any, parsedUrl);
  });

  httpServer.listen(port, hostname, () => {
    const localIp = ip.address();
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> LAN Access: http://${localIp}:${port}`);
  });
});
