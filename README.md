# 📡 WiFi LAN Link (Wifi File Sharer)

**WiFi LAN Link** es una aplicación web moderna y ultrarrápida diseñada para compartir archivos y mensajes en tiempo real entre dispositivos conectados a la misma red local (WiFi o Ethernet). Sin configuraciones complicadas, sin necesidad de internet y con total privacidad.

Creado por [Isaias Fernandez](https://github.com/isaiasfer).

---

## ✨ Características Principales

- **Velocidad de Red Local**: Las transferencias ocurren a la máxima velocidad de tu router, sin pasar por servidores externos.
- **Salas Temporales (Efímeras)**: No requiere base de datos. Todo vive en la memoria RAM y los archivos se borran automáticamente al cerrar la sala.
- **Chat en Tiempo Real**: Comunícate instantáneamente con los demás miembros de la sala.
- **Multidispositivo**: Funciona en Windows, macOS, Linux, Android e iOS a través del navegador.
- **Moderación Avanzada**: El host de la sala puede expulsar (`kick`), bloquear por IP (`ban`), y borrar mensajes o archivos.
- **Panel de Administración**: Acceso exclusivo para el administrador del servidor (localhost) para supervisar todas las salas en "Modo Fantasma".
- **Privacidad**: Opción de proteger salas con contraseña.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend**: [Next.js 15](https://nextjs.org/) (React, TypeScript)
- **Servidor**: [Express](https://expressjs.com/) & [Node.js](https://nodejs.org/)
- **Comunicación**: [Socket.io](https://socket.io/) para eventos bidireccionales en tiempo real.
- **Estilos**: Vanilla CSS con estética **Cyberpunk/Dark Mode**.
- **Manejo de Archivos**: `Formidable` para subidas eficientes y flujo de streams para descargas.

---

## 🚀 Instalación y Uso

### Opción 1: Uso instantáneo (Recomendado)
Si tienes Node.js instalado, puedes ejecutar la aplicación sin instalar nada permanentemente:
```bash
npx wifi-file-sharer
```

### Opción 2: Instalación Global
Para tener el comando siempre disponible:
```bash
npm install -g wifi-file-sharer
# Luego simplemente ejecuta:
wifi-file-sharer
```

### Opción 3: Modo Desarrollador
Si quieres modificar el código:
1. **Clonar e instalar**:
   ```bash
   git clone https://github.com/isaiasfer/wifiFileSharer.git
   cd wifiFileSharer
   npm install
   ```
2. **Iniciar**:
   ```bash
   npm run dev
   ```

### ⚙️ Opciones avanzadas
El comando acepta parámetros para personalizar la ejecución:
```bash
wifi-file-sharer --port 4000 --host 0.0.0.0
```

### Cómo acceder desde otros dispositivos
Para compartir archivos con alguien más en tu casa o oficina:

1. El servidor te indicará tu IP local en la terminal, por ejemplo: `http://192.168.1.15:3000`.
2. Escanea el código QR o escribe esa dirección en el navegador de tu móvil, tablet u otro PC.
3. Asegúrate de que todos los dispositivos estén en la **misma red WiFi**.

---

## 📖 Guía de Uso

### 🏠 Inicio
Al entrar, verás dos opciones:
- **Unirse**: Ingresa tu nombre y el código de 4 letras de una sala ya existente.
- **Crear**: Define tu nombre, una contraseña opcional y el límite máximo de tamaño de archivo.

### 👑 Poderes del Host (Dueño de la sala)
Si tú creaste la sala, eres el **Host** y tienes control total:
- **Borrar contenido**: Haz clic en la `X` roja de cualquier mensaje o archivo para eliminarlo.
- **Gestionar usuarios**: En el panel de participantes, puedes expulsar a alguien o bloquear su IP permanentemente de esa sala.

### 🛡️ Panel de Administración (Localhost)
Si accedes desde el mismo ordenador donde corre el servidor (`http://localhost:3000`), verás el **Panel Admin**:
- **Ver salas activas**: Monitorea cuántas personas y archivos hay en cada sala.
- **Modo Fantasma 👻**: Únete a cualquier sala sin aparecer en la lista de usuarios.
- **Cerrar salas**: Elimina cualquier sala y sus archivos de forma forzosa.

---

## 📝 Notas Técnicas

- **Almacenamiento**: Los archivos se guardan temporalmente en la carpeta `wifi-sharer-uploads` dentro del directorio desde donde ejecutaste el comando.
- **Seguridad**: El bloqueo por IP (`ban`) es efectivo mientras el servidor no se reinicie, ya que la lista es en memoria.
- **HTTPS**: Para que el botón de copiar funcione en todos los navegadores móviles, se recomienda acceder mediante HTTPS o usar los fallbacks implementados en la app.

---

## 🤝 Contribuciones

Si tienes ideas para mejorar la aplicación, ¡siéntete libre de abrir un **Pull Request** o una **Issue** en GitHub!

Desarrollado con ❤️ para facilitar el intercambio de archivos libre y rápido.
