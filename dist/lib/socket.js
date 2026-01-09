"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocket = void 0;
const rooms_1 = require("./rooms");
function parseUserAgent(ua) {
    let os = "Unknown";
    let browser = "Unknown";
    if (ua.includes("Windows"))
        os = "Windows";
    else if (ua.includes("Mac OS"))
        os = "macOS";
    else if (ua.includes("Linux"))
        os = "Linux";
    else if (ua.includes("Android"))
        os = "Android";
    else if (ua.includes("iPhone") || ua.includes("iPad"))
        os = "iOS";
    if (ua.includes("Firefox"))
        browser = "Firefox";
    else if (ua.includes("Edg/"))
        browser = "Edge";
    else if (ua.includes("Chrome"))
        browser = "Chrome";
    else if (ua.includes("Safari"))
        browser = "Safari";
    else if (ua.includes("Opera") || ua.includes("OPR"))
        browser = "Opera";
    return { os, browser };
}
// Check if connection is from localhost (server admin)
function isLocalhost(ip) {
    return ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1";
}
const setupSocket = (io) => {
    io.on("connection", (socket) => {
        const clientIp = socket.handshake.address || "Unknown";
        const userAgent = socket.handshake.headers["user-agent"] || "";
        const { os, browser } = parseUserAgent(userAgent);
        const isAdmin = isLocalhost(clientIp);
        // Tell client if they are admin
        socket.emit("admin_status", { isAdmin });
        socket.on("create_room", ({ nickname, password, maxFileSize, customId }, callback) => {
            const settings = {};
            if (maxFileSize)
                settings.maxFileSize = maxFileSize;
            try {
                const room = (0, rooms_1.createRoom)(socket.id, password, settings, customId);
                const user = {
                    id: socket.id,
                    nickname,
                    roomId: room.id,
                    ip: clientIp,
                    userAgent,
                    os,
                    browser,
                    joinedAt: Date.now(),
                };
                (0, rooms_1.joinRoom)(room.id, user, password);
                socket.join(room.id);
                callback({ success: true, roomId: room.id });
                io.to(room.id).emit("room_updated", (0, rooms_1.getRoom)(room.id));
            }
            catch (error) {
                callback({ success: false, error: error.message || "Error al crear sala" });
            }
        });
        socket.on("join_room", ({ roomId, nickname, password }, callback) => {
            const user = {
                id: socket.id,
                nickname,
                roomId,
                ip: clientIp,
                userAgent,
                os,
                browser,
                joinedAt: Date.now(),
            };
            const result = (0, rooms_1.joinRoom)(roomId, user, password);
            if (result.success) {
                socket.join(roomId);
                const room = (0, rooms_1.getRoom)(roomId);
                callback({ success: true, room });
                io.to(roomId).emit("room_updated", room);
            }
            else {
                callback({ success: false, error: result.error });
            }
        });
        // Admin: Join room as ghost (invisible observer)
        socket.on("join_room_ghost", ({ roomId }, callback) => {
            if (!isAdmin) {
                callback({ success: false, error: "No autorizado" });
                return;
            }
            const ghost = {
                id: socket.id,
                nickname: "👻 Admin",
                roomId,
                ip: clientIp,
                userAgent,
                os,
                browser,
                joinedAt: Date.now(),
                isGhost: true,
            };
            const result = (0, rooms_1.joinRoomAsGhost)(roomId, ghost);
            if (result.success) {
                socket.join(roomId);
                callback({ success: true, room: result.room });
                // Don't broadcast room_updated to hide ghost
            }
            else {
                callback({ success: false, error: result.error });
            }
        });
        // Admin: Get all active rooms
        socket.on("get_all_rooms", (callback) => {
            if (!isAdmin) {
                callback({ success: false, error: "No autorizado" });
                return;
            }
            callback({ success: true, rooms: (0, rooms_1.getAllRooms)() });
        });
        // Host: Kick user from room
        socket.on("kick_user", ({ roomId, targetUserId }, callback) => {
            const room = (0, rooms_1.getRoom)(roomId);
            if (!room || room.hostId !== socket.id) {
                callback({ success: false, error: "No autorizado" });
                return;
            }
            const result = (0, rooms_1.kickUser)(roomId, targetUserId);
            if (result.success) {
                io.to(targetUserId).emit("you_were_kicked");
                const targetSocket = io.sockets.sockets.get(targetUserId);
                if (targetSocket) {
                    targetSocket.leave(roomId);
                }
                io.to(roomId).emit("room_updated", (0, rooms_1.getRoom)(roomId));
                callback({ success: true });
            }
            else {
                callback({ success: false, error: "Usuario no encontrado" });
            }
        });
        // Host: Ban user IP from room
        socket.on("ban_user", ({ roomId, targetUserId, targetIp }, callback) => {
            const room = (0, rooms_1.getRoom)(roomId);
            if (!room || room.hostId !== socket.id) {
                callback({ success: false, error: "No autorizado" });
                return;
            }
            const kickResult = (0, rooms_1.kickUser)(roomId, targetUserId);
            if (targetIp) {
                (0, rooms_1.banUserIp)(roomId, targetIp);
            }
            if (kickResult.success) {
                io.to(targetUserId).emit("you_were_banned");
                const targetSocket = io.sockets.sockets.get(targetUserId);
                if (targetSocket) {
                    targetSocket.leave(roomId);
                }
                io.to(roomId).emit("room_updated", (0, rooms_1.getRoom)(roomId));
                callback({ success: true });
            }
            else {
                callback({ success: false });
            }
        });
        // Admin: Close room forcefully
        socket.on("admin_close_room", ({ roomId }, callback) => {
            if (!isAdmin) {
                callback({ success: false, error: "No autorizado" });
                return;
            }
            const room = (0, rooms_1.getRoom)(roomId);
            if (!room) {
                callback({ success: false, error: "Sala no encontrada" });
                return;
            }
            io.to(roomId).emit("room_closed");
            (0, rooms_1.deleteRoom)(roomId);
            callback({ success: true });
        });
        // Host: Delete file
        socket.on("delete_file", ({ roomId, fileId }, callback) => {
            const room = (0, rooms_1.getRoom)(roomId);
            if (!room || room.hostId !== socket.id) {
                callback({ success: false, error: "No autorizado" });
                return;
            }
            const success = (0, rooms_1.removeFileFromRoom)(roomId, fileId);
            if (success) {
                io.to(roomId).emit("room_updated", (0, rooms_1.getRoom)(roomId));
                callback({ success: true });
            }
            else {
                callback({ success: false, error: "Archivo no encontrado" });
            }
        });
        // Host: Delete text
        socket.on("delete_text", ({ roomId, textId }, callback) => {
            const room = (0, rooms_1.getRoom)(roomId);
            if (!room || room.hostId !== socket.id) {
                callback({ success: false, error: "No autorizado" });
                return;
            }
            const success = (0, rooms_1.removeTextFromRoom)(roomId, textId);
            if (success) {
                io.to(roomId).emit("room_updated", (0, rooms_1.getRoom)(roomId));
                callback({ success: true });
            }
            else {
                callback({ success: false, error: "Mensaje no encontrado" });
            }
        });
        socket.on("send_text", ({ roomId, content, senderName }) => {
            const text = {
                id: Math.random().toString(36).substr(2, 9),
                content,
                senderId: socket.id,
                senderName,
                createdAt: Date.now(),
            };
            (0, rooms_1.addTextToRoom)(roomId, text);
            io.to(roomId).emit("new_text", text);
            const room = (0, rooms_1.getRoom)(roomId);
            if (room)
                io.to(roomId).emit("room_updated", room);
        });
        // User voluntarily leaves room
        socket.on("leave_room", ({ roomId }, callback) => {
            const room = (0, rooms_1.leaveRoom)(roomId, socket.id);
            socket.leave(roomId);
            if (room) {
                // Room still exists, notify other users
                io.to(roomId).emit("room_updated", room);
                callback({ success: true });
            }
            else {
                // Room was deleted (no users left)
                io.to(roomId).emit("room_closed");
                callback({ success: true });
            }
        });
        // Reconnect to an existing room after page refresh
        socket.on("reconnect_to_room", ({ roomId, nickname, password }, callback) => {
            const room = (0, rooms_1.getRoom)(roomId);
            if (!room) {
                callback({ success: false, error: "Sala no encontrada" });
                return;
            }
            // Check if IP is banned
            if (room.bannedIps.includes(clientIp)) {
                callback({ success: false, error: "Has sido bloqueado de esta sala" });
                return;
            }
            // Verify password if room has one
            if (room.password && room.password !== password) {
                callback({ success: false, error: "Contraseña incorrecta" });
                return;
            }
            // Check if user with this nickname exists in the room
            const existingUser = room.users.find((u) => u.nickname === nickname);
            if (existingUser) {
                // User was in the room, update their socket ID
                const result = (0, rooms_1.updateUserSocketId)(roomId, existingUser.id, socket.id, nickname);
                if (result.success && result.room) {
                    socket.join(roomId);
                    callback({ success: true, room: result.room });
                    io.to(roomId).emit("room_updated", result.room);
                }
                else {
                    callback({ success: false, error: result.error || "Error al reconectar" });
                }
            }
            else {
                // User was not in the room, treat as new join
                const user = {
                    id: socket.id,
                    nickname,
                    roomId,
                    ip: clientIp,
                    userAgent,
                    os,
                    browser,
                    joinedAt: Date.now(),
                };
                const joinResult = (0, rooms_1.joinRoom)(roomId, user, password);
                if (joinResult.success) {
                    socket.join(roomId);
                    const updatedRoom = (0, rooms_1.getRoom)(roomId);
                    callback({ success: true, room: updatedRoom });
                    io.to(roomId).emit("room_updated", updatedRoom);
                }
                else {
                    callback({ success: false, error: joinResult.error });
                }
            }
        });
        socket.on("disconnecting", () => {
            for (const roomId of socket.rooms) {
                if (roomId !== socket.id) {
                    const room = (0, rooms_1.leaveRoom)(roomId, socket.id);
                    if (room) {
                        io.to(roomId).emit("room_updated", room);
                    }
                    else {
                        io.to(roomId).emit("room_closed");
                    }
                }
            }
        });
    });
};
exports.setupSocket = setupSocket;
