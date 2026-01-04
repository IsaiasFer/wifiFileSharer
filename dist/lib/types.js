"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FILE_TYPE_ICONS = exports.FILE_SIZE_OPTIONS = exports.DEFAULT_ROOM_SETTINGS = void 0;
exports.getFileCategory = getFileCategory;
exports.DEFAULT_ROOM_SETTINGS = {
    maxFileSize: 100 * 1024 * 1024,
};
exports.FILE_SIZE_OPTIONS = [
    { label: "10 MB", value: 10 * 1024 * 1024 },
    { label: "50 MB", value: 50 * 1024 * 1024 },
    { label: "100 MB", value: 100 * 1024 * 1024 },
    { label: "250 MB", value: 250 * 1024 * 1024 },
    { label: "500 MB", value: 500 * 1024 * 1024 },
];
// File type categories for icons
exports.FILE_TYPE_ICONS = {
    image: "image",
    video: "video",
    audio: "audio",
    pdf: "pdf",
    document: "document",
    spreadsheet: "spreadsheet",
    archive: "archive",
    code: "code",
    default: "file",
};
function getFileCategory(mimeType) {
    if (mimeType.startsWith("image/"))
        return "image";
    if (mimeType.startsWith("video/"))
        return "video";
    if (mimeType.startsWith("audio/"))
        return "audio";
    if (mimeType === "application/pdf")
        return "pdf";
    if (mimeType.includes("word") || mimeType.includes("document"))
        return "document";
    if (mimeType.includes("sheet") || mimeType.includes("excel"))
        return "spreadsheet";
    if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("tar") || mimeType.includes("gz"))
        return "archive";
    if (mimeType.includes("javascript") || mimeType.includes("json") || mimeType.includes("xml") || mimeType.includes("html") || mimeType.includes("css"))
        return "code";
    return "default";
}
