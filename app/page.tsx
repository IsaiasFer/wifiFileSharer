"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import io, { Socket } from "socket.io-client";
import { Room } from "@/lib/types";
import ConnectForm from "./components/ConnectForm";
import RoomView from "./components/RoomView";
import AdminPanel from "./components/AdminPanel";
import Modal from "./components/Modal";

// Types for recent rooms
interface RecentRoom {
  id: string;
  password?: string;
  joinedAt: number;
}

// Helper functions for recent rooms storage
const RECENT_ROOMS_KEY = "wifi_sharer_recent_rooms";
const MAX_RECENT_ROOMS = 10;

function getRecentRooms(): RecentRoom[] {
  try {
    const stored = localStorage.getItem(RECENT_ROOMS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addRecentRoom(roomId: string, password?: string) {
  const recent = getRecentRooms().filter(r => r.id !== roomId);
  recent.unshift({ id: roomId, password, joinedAt: Date.now() });
  if (recent.length > MAX_RECENT_ROOMS) recent.pop();
  localStorage.setItem(RECENT_ROOMS_KEY, JSON.stringify(recent));
}

function removeRecentRoom(roomId: string) {
  const recent = getRecentRooms().filter(r => r.id !== roomId);
  localStorage.setItem(RECENT_ROOMS_KEY, JSON.stringify(recent));
}

export default function Home() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentView, setCurrentView] = useState<"home" | "room">("home");
  const [room, setRoom] = useState<Room | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isGhost, setIsGhost] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [recentRooms, setRecentRooms] = useState<RecentRoom[]>([]);
  const [activeRecentRooms, setActiveRecentRooms] = useState<string[]>([]);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const reconnectAttemptRef = useRef(0);

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

  const showModal = useCallback((title: string, message: string, type: "info" | "warning" | "error" = "info") => {
    setModalConfig({ isOpen: true, title, message, type });
  }, []);

  // Load recent rooms from localStorage on mount
  useEffect(() => {
    setRecentRooms(getRecentRooms());
  }, [currentView]);

  // Check which recent rooms are still active
  const checkActiveRecentRooms = useCallback((socketInstance: Socket) => {
    const recent = getRecentRooms();
    if (recent.length === 0) {
      setActiveRecentRooms([]);
      return;
    }

    socketInstance.emit("check_rooms_exist", { roomIds: recent.map(r => r.id) }, (response: { activeRooms: string[] }) => {
      if (response && response.activeRooms) {
        setActiveRecentRooms(response.activeRooms);
        // Remove inactive rooms from recent list
        const stillActive = recent.filter(r => response.activeRooms.includes(r.id));
        if (stillActive.length !== recent.length) {
          localStorage.setItem(RECENT_ROOMS_KEY, JSON.stringify(stillActive));
          setRecentRooms(stillActive);
        }
      }
    });
  }, []);

  useEffect(() => {
    const socketInstance = io({
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });
    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      console.log("Connected:", socketInstance.id);
      reconnectAttemptRef.current = 0;
      setIsReconnecting(false);
      
      // Check active recent rooms
      checkActiveRecentRooms(socketInstance);
      
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

    // Socket disconnection handling with reconnection indicator
    socketInstance.on("disconnect", (reason) => {
      console.log("Disconnected:", reason);
      setIsReconnecting(true);
      
      // If the server disconnected us intentionally, we might want to handle it differently
      if (reason === "io server disconnect") {
        // The server forcefully disconnected us, try to reconnect
        socketInstance.connect();
      }
      // For other reasons (transport close, ping timeout, etc.), socket.io will auto-reconnect
    });

    socketInstance.on("reconnect_attempt", (attempt) => {
      console.log("Reconnection attempt:", attempt);
      reconnectAttemptRef.current = attempt;
    });

    socketInstance.on("reconnect_failed", () => {
      console.log("Reconnection failed after all attempts");
      setIsReconnecting(false);
      showModal("Error de Conexión", "No se pudo reconectar al servidor. Por favor, recarga la página.", "error");
    });

    socketInstance.on("admin_status", ({ isAdmin: admin }) => {
      setIsAdmin(admin);
    });

    socketInstance.on("room_updated", (updatedRoom: Room) => {
      setRoom(updatedRoom);
      setCurrentView("room");
    });

    socketInstance.on("room_closed", () => {
      const currentRoomId = localStorage.getItem("wifi_sharer_room_id");
      if (currentRoomId) {
        removeRecentRoom(currentRoomId);
      }
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
  }, [showModal, checkActiveRecentRooms]);

  // Called when user successfully joins a room - adds to recent
  const handleRoomJoined = useCallback((roomId: string, password?: string) => {
    addRecentRoom(roomId, password);
    setRecentRooms(getRecentRooms());
  }, []);

  // Called when user exits a room - update state
  const handleRoomExited = useCallback(() => {
    setRoom(null);
    setCurrentView("home");
    setIsGhost(false);
    // Refresh recent rooms list
    if (socket) {
      checkActiveRecentRooms(socket);
    }
  }, [socket, checkActiveRecentRooms]);

  // Join a recent room
  const handleJoinRecentRoom = useCallback((recentRoom: RecentRoom) => {
    if (!socket) return;
    
    const savedNickname = localStorage.getItem("wifi_sharer_nickname");
    if (!savedNickname) {
      showModal("Apodo Requerido", "Por favor, ingresa un apodo primero usando el formulario de abajo.", "warning");
      return;
    }

    socket.emit("join_room", { 
      roomId: recentRoom.id, 
      nickname: savedNickname, 
      password: recentRoom.password || "" 
    }, (res: any) => {
      if (res.success) {
        localStorage.setItem("wifi_sharer_room_id", recentRoom.id);
        localStorage.setItem("wifi_sharer_room_password", recentRoom.password || "");
        setRoom(res.room);
        setCurrentView("room");
        addRecentRoom(recentRoom.id, recentRoom.password);
      } else {
        if (res.error === "Sala no encontrada") {
          removeRecentRoom(recentRoom.id);
          setRecentRooms(getRecentRooms());
        }
        showModal("Error", res.error || "Error al unirse a la sala.", "error");
      }
    });
  }, [socket, showModal]);

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
          addRecentRoom(roomId);
        } else {
          showModal("Error", res.error || "Error al entrar a la sala.", "error");
        }
      });
    }
  };

  // Get active recent rooms for display
  const displayRecentRooms = recentRooms.filter(r => activeRecentRooms.includes(r.id));

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
      {/* Reconnection Indicator */}
      {isReconnecting && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            background: "rgba(245, 158, 11, 0.15)",
            borderBottom: "1px solid var(--warning)",
            padding: "12px 16px",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
          }}
        >
          <svg className="animate-pulse" width="20" height="20" fill="none" stroke="var(--warning)" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" opacity="0.3" />
            <path d="M12 2a10 10 0 0 1 10 10" />
          </svg>
          <span style={{ color: "var(--warning)", fontWeight: 500 }}>
            Reconectando al servidor...
          </span>
        </div>
      )}

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
            <>
              <ConnectForm socket={socket} onRoomJoined={handleRoomJoined} />
              
              {/* Recent Rooms Section */}
              {displayRecentRooms.length > 0 && (
                <div className="w-full animate-fadeIn">
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "8px", 
                    marginBottom: "12px",
                    paddingLeft: "4px"
                  }}>
                    <svg width="16" height="16" fill="none" stroke="var(--muted)" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span className="text-muted" style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                      Salas Recientes
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {displayRecentRooms.map((recentRoom) => (
                      <button
                        key={recentRoom.id}
                        onClick={() => handleJoinRecentRoom(recentRoom)}
                        className="recent-room-btn"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          width: "100%",
                          padding: "12px 16px",
                          background: "rgba(255, 255, 255, 0.03)",
                          border: "1px solid var(--card-border)",
                          borderRadius: "var(--radius)",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <span 
                            className="text-gradient" 
                            style={{ 
                              fontWeight: 700, 
                              letterSpacing: "2px", 
                              fontSize: "1rem" 
                            }}
                          >
                            {recentRoom.id}
                          </span>
                          {recentRoom.password && (
                            <span style={{ opacity: 0.5 }}>
                              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <circle cx="12" cy="16" r="1" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                              </svg>
                            </span>
                          )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span className="badge badge-success" style={{ fontSize: "0.65rem" }}>
                            Activa
                          </span>
                          <svg width="16" height="16" fill="none" stroke="var(--primary)" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M9 18l6-6-6-6" />
                          </svg>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <footer className="text-muted text-center" style={{ fontSize: "0.75rem" }}>
            <p>Asegúrate de estar en el mismo WiFi</p>
            {isAdmin && <p className="text-primary" style={{ marginTop: "4px" }}>🛡️ Modo Administrador Activo</p>}
          </footer>
        </div>
      ) : (
        room && <RoomView socket={socket} room={room} currentUserId={socket.id || ""} isGhost={isGhost} onRoomExited={handleRoomExited} />
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
