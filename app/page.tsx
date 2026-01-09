"use client";

import { useEffect, useState } from "react";
import io, { Socket } from "socket.io-client";
import { Room } from "@/lib/types";
import ConnectForm from "./components/ConnectForm";
import RoomView from "./components/RoomView";
import AdminPanel from "./components/AdminPanel";
import Modal from "./components/Modal";

export default function Home() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentView, setCurrentView] = useState<"home" | "room">("home");
  const [room, setRoom] = useState<Room | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isGhost, setIsGhost] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Notification Modal State
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "info" | "warning" | "error";
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info"
  });

  const showModal = (title: string, message: string, type: "info" | "warning" | "error" = "info") => {
    setModalConfig({ isOpen: true, title, message, type });
  };

  useEffect(() => {
    const socketInstance = io();
    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      console.log("Connected:", socketInstance.id);
      
      // Try to reconnect to a previous session
      const savedRoomId = localStorage.getItem("wifi_sharer_room_id");
      const savedNickname = localStorage.getItem("wifi_sharer_nickname");
      const savedPassword = localStorage.getItem("wifi_sharer_room_password");

      if (savedRoomId && savedNickname) {
        console.log("Attempting to reconnect to room:", savedRoomId);
        socketInstance.emit("reconnect_to_room", {
          roomId: savedRoomId,
          nickname: savedNickname,
          password: savedPassword || ""
        }, (response: any) => {
          if (response.success && response.room) {
            console.log("Successfully reconnected to room");
            setRoom(response.room);
            setCurrentView("room");
          } else {
            console.log("Failed to reconnect:", response.error);
            // Clear session data on failed reconnection
            localStorage.removeItem("wifi_sharer_room_id");
            localStorage.removeItem("wifi_sharer_room_password");
            
            // Show error message if it's not just "room not found" (which is normal after some time)
            if (response.error && response.error !== "Sala no encontrada") {
              showModal("Error de Reconexión", response.error, "warning");
            }
          }
        });
      }
    });

    socketInstance.on("admin_status", ({ isAdmin: admin }) => {
      setIsAdmin(admin);
    });

    socketInstance.on("room_updated", (updatedRoom: Room) => {
      setRoom(updatedRoom);
      setCurrentView("room");
    });

    socketInstance.on("room_closed", () => {
      setRoom(null);
      setCurrentView("home");
      setIsGhost(false);
      // Clear session data
      localStorage.removeItem("wifi_sharer_room_id");
      localStorage.removeItem("wifi_sharer_room_password");
      showModal("Sala Cerrada", "La sala ha sido cerrada y todos los archivos han sido eliminados.", "warning");
    });

    socketInstance.on("you_were_kicked", () => {
      setRoom(null);
      setCurrentView("home");
      // Clear session data
      localStorage.removeItem("wifi_sharer_room_id");
      localStorage.removeItem("wifi_sharer_room_password");
      showModal("Fuiste Expulsado", "El anfitrión te ha expulsado de la sala.", "warning");
    });

    socketInstance.on("you_were_banned", () => {
      setRoom(null);
      setCurrentView("home");
      // Clear session data
      localStorage.removeItem("wifi_sharer_room_id");
      localStorage.removeItem("wifi_sharer_room_password");
      showModal("Has sido Bloqueado", "Has sido bloqueado de esta sala y no podrás volver a entrar.", "error");
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const handleAdminJoinRoom = (roomId: string, ghost: boolean) => {
    if (!socket) return;

    if (ghost) {
      socket.emit("join_room_ghost", { roomId }, (res: any) => {
        if (res.success) {
          setRoom(res.room);
          setCurrentView("room");
          setIsGhost(true);
          setShowAdminPanel(false);
        } else {
          showModal("Error", res.error || "No se pudo entrar en modo fantasma.", "error");
        }
      });
    } else {
      const nickname = prompt("Ingresa tu apodo para esta sala:") || "Admin";
      socket.emit("join_room", { roomId, nickname, password: "" }, (res: any) => {
        if (res.success) {
          setRoom(res.room);
          setCurrentView("room");
          setIsGhost(false);
          setShowAdminPanel(false);
        } else {
          showModal("Error", res.error || "Error al entrar a la sala.", "error");
        }
      });
    }
  };

  if (!socket) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-pulse" width="48" height="48" fill="none" stroke="var(--primary)" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" opacity="0.3" />
            <path d="M12 2a10 10 0 0 1 10 10" />
          </svg>
          <span className="text-muted">Conectando...</span>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-4 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Effects */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "radial-gradient(ellipse at 50% 0%, rgba(0, 240, 255, 0.08) 0%, transparent 50%)",
        pointerEvents: "none",
        zIndex: 0
      }} />
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "radial-gradient(ellipse at 80% 80%, rgba(168, 85, 247, 0.05) 0%, transparent 50%)",
        pointerEvents: "none",
        zIndex: 0
      }} />

      {currentView === "home" ? (
        <div className="flex flex-col gap-6 items-center w-full max-w-lg animate-slideUp relative" style={{ zIndex: 1 }}>
          <div className="text-center">
            <div className="flex flex-col items-center justify-center gap-3 mb-4">
              <img src="/icon.png" alt="Wifi File Sharer Logo" width="80" height="80" className="animate-glow rounded-2xl" />
              <h1 className="text-gradient" style={{ fontSize: "clamp(1.75rem, 7vw, 3rem)", fontWeight: 700, letterSpacing: "-1px", lineHeight: 1.1 }}>
                Wifi File Sharer
              </h1>
              <a
                href="https://github.com/isaiasfer"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted hover:text-primary transition-colors"
                style={{ fontSize: "0.85rem", textDecoration: "none", opacity: 0.8 }}
              >
                Creado por Isaias Fernandez
              </a>
            </div>
            <p className="text-muted" style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
              Comparte archivos en tu red local
            </p>
          </div>

          {isAdmin && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowAdminPanel(!showAdminPanel)}
              style={{
                borderColor: showAdminPanel ? "var(--primary)" : "var(--card-border)",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              🛡️ <span>Panel Admin</span>
            </button>
          )}

          {showAdminPanel && isAdmin ? (
            <AdminPanel socket={socket} onJoinRoom={handleAdminJoinRoom} />
          ) : (
            <ConnectForm socket={socket} />
          )}

          <footer className="text-muted text-center" style={{ fontSize: "0.75rem" }}>
            <p>Asegúrate de estar en el mismo WiFi</p>
            {isAdmin && <p className="text-primary" style={{ marginTop: "4px" }}>🛡️ Modo Administrador Activo</p>}
          </footer>
        </div>
      ) : (
        room && <RoomView socket={socket} room={room} currentUserId={socket.id || ""} isGhost={isGhost} />
      )}

      {/* Global Notification Modal */}
      <Modal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />
    </main>
  );
}
