# 📡 WiFi LAN Link (wifi-file-sharer)

[**English**](#english) | [**Español**](#español)

---

<a name="english"></a>

## 🇺🇸 English

**WiFi LAN Link** is a modern, ultra-fast web application designed to share files and messages in real-time between devices connected to the same local network (WiFi or Ethernet). No complicated configurations, no internet required, and total privacy.

Created by [Isaias Fernandez](https://github.com/isaiasfer).

### ✨ Key Features

- **Local Network Speed**: Transfers occur at your router's maximum speed, without passing through external servers.
- **Ephemeral Rooms**: No database required. Everything lives in RAM, and files are automatically deleted when the room is closed.
- **Real-Time Chat**: Communicate instantly with other members in the room.
- **Multi-Device**: Works on Windows, macOS, Linux, Android, and iOS via browser.
- **Advanced Moderation**: The room host can kick, IP-ban, and delete messages or files.
- **Admin Dashboard**: Exclusive access for the server admin (localhost) to monitor all rooms in "Ghost Mode".
- **Privacy**: Option to password-protect rooms.
- **Security**: No external dependencies for IP tracking (Zero SSRF risk).

### 🚀 Installation and Usage

#### Option 1: Instant Usage (Recommended)
If you have Node.js installed, you can run the app without installing anything permanently:
```bash
npx wifi-file-sharer
```

#### Option 2: Global Installation
To have the command always available:
```bash
npm install -g wifi-file-sharer
# Then simply run:
wifi-file-sharer
```

### ⚙️ Advanced Options
The command accepts parameters for custom execution:
```bash
wifi-file-sharer --port 4000 --host 0.0.0.0
```

#### How to access from other devices
1. The server will display your local IP in the terminal, e.g., `http://192.168.1.15:3000`.
2. Type that address into the browser of your mobile, tablet, or another PC.
3. Ensure all devices are on the **same WiFi network**.

---

### ❓ Frequently Asked Questions (FAQ)

**What is the transfer speed?**
The speed is limited solely by your local network hardware (Router, WiFi standard, or Ethernet). Since data doesn't leave your LAN, you can expect speeds between 10MB/s and 100MB/s depending on your connection quality.

**Where are the files stored?**
Files are stored on the **host machine's disk** (the one running the command). Metadata (rooms, users, chat) lives in RAM and is lost if the server restarts.

**Is it secure?**
This tool is designed for **trusted, private networks**. It uses HTTP (unencrypted), meaning anyone on the same network with advanced tools could potentially intercept traffic. For enterprise use, ensure you are on a password-protected, secure WiFi.

**Does it clean up automatically?**
Yes. Files are deleted when a room is closed by the host. Additionally, any "orphan" files from previous crashes are cleared every time the application starts.

**What is the ideal use case?**
Fast, "one-and-done" file or text sharing in an office or home environment where you want to avoid the friction of logging into WhatsApp, Cloud Drives, or Slack just to pass a single file.

---

<a name="español"></a>

## 🇲🇽 Español

**WiFi LAN Link** es una aplicación web moderna y ultrarrápida diseñada para compartir archivos y mensajes en tiempo real entre dispositivos conectados a la misma red local (WiFi o Ethernet). Sin configuraciones complicadas, sin necesidad de internet y con total privacidad.

Creado por [Isaias Fernandez](https://github.com/isaiasfer).

### ✨ Características Principales

- **Velocidad de Red Local**: Las transferencias ocurren a la máxima velocidad de tu router, sin pasar por servidores externos.
- **Salas Temporales (Efímeras)**: No requiere base de datos. Todo vive en la memoria RAM y los archivos se borran automáticamente al cerrar la sala.
- **Chat en Tiempo Real**: Comunícate instantáneamente con los demás miembros de la sala.
- **Multidispositivo**: Funciona en Windows, macOS, Linux, Android e iOS a través del navegador.
- **Moderación Avanzada**: El host de la sala puede expulsar (`kick`), bloquear por IP (`ban`), y borrar mensajes o archivos.
- **Panel de Administración**: Acceso exclusivo para el administrador del servidor (localhost) para supervisar todas las salas en "Modo Fantasma".
- **Privacidad**: Opción de proteger salas con contraseña.
- **Seguridad**: Sin dependencias externas para rastreo de IP (Cero riesgo de SSRF).

### 🚀 Instalación y Uso

#### Opción 1: Uso instantáneo (Recomendado)
Si tienes Node.js instalado, puedes ejecutar la aplicación sin instalar nada permanentemente:
```bash
npx wifi-file-sharer
```

#### Opción 2: Instalación Global
Para tener el comando siempre disponible:
```bash
npm install -g wifi-file-sharer
# Luego simplemente ejecuta:
wifi-file-sharer
```

### ⚙️ Opciones avanzadas
El comando acepta parámetros para personalizar la ejecución:
```bash
wifi-file-sharer --port 4000 --host 0.0.0.0
```

#### Cómo acceder desde otros dispositivos
1. El servidor te indicará tu IP local en la terminal, por ejemplo: `http://192.168.1.15:3000`.
2. Escribe esa dirección en el navegador de tu móvil, tablet u otro PC.
3. Asegúrate de que todos los dispositivos estén en la **misma red WiFi**.

---

### ❓ Preguntas Frecuentes (FAQ)

**¿Cuál es la velocidad de transferencia?**
La velocidad está limitada únicamente por tu hardware de red local (Router, estándar de WiFi o Ethernet). Como los datos no salen de tu red local, puedes esperar velocidades de entre 10MB/s y 100MB/s según tu conexión.

**¿Dónde se alojan los archivos?**
Los archivos se guardan en el **disco de la computadora host** (la que ejecuta el comando). Los metadatos (salas, usuarios, chat) viven en la RAM y se pierden si el servidor se reinicia.

**¿Es seguro?**
Esta herramienta está diseñada para **redes privadas y de confianza**. Utiliza HTTP (sin cifrar), por lo que alguien en la misma red con herramientas avanzadas podría interceptar el tráfico. Para uso empresarial, asegúrate de estar en una red WiFi segura con contraseña.

**¿Se limpia automáticamente?**
Sí. Los archivos se borran cuando el host cierra la sala. Además, cualquier archivo "huérfano" de sesiones anteriores se elimina automáticamente cada vez que se inicia la aplicación.

**¿Cuál es el caso de uso ideal?**
Intercambio rápido de archivos o texto en entornos de oficina o casa donde quieres evitar la fricción de iniciar sesión en WhatsApp, Drive o Slack solo para pasar un archivo puntual.

---

### 🛠️ Technical Stack / Tecnologías

- **Frontend**: [Next.js](https://nextjs.org/) (React, TypeScript)
- **Server**: [Express](https://expressjs.com/) & [Node.js](https://nodejs.org/)
- **Communication**: [Socket.io](https://socket.io/)
- **Styles**: Vanilla CSS (**Cyberpunk/Dark Mode**)

### 🤝 Contributions
Feel free to open a **Pull Request** or an **Issue** on GitHub!
[https://github.com/isaiasfer/wifiFileSharer](https://github.com/isaiasfer/wifiFileSharer)

Desarrollado con ❤️ para facilitar el intercambio de archivos libre y rápido.
