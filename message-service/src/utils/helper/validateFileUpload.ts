import { ReturnResult } from "src/shared/dtos/helper/ReturnResult";

export const validateImage = (file: Express.Multer.File): ReturnResult<boolean> => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!file) {
        return { Result: false, Message: 'No file provided' };
    }

    if (!allowedMimes.includes(file.mimetype)) {
        return { Result: false, Message: 'Invalid image format. Allowed: JPEG, JPG, PNG, GIF, WebP, BMP' };
    }

    if (file.size > maxSize) {
        return { Result: false, Message: 'Image size exceeds 10MB limit' };
    }

    return { Result: true, Message: undefined };
};

export const validateVideo = (file: Express.Multer.File): ReturnResult<boolean> => {
    const allowedMimes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm'];
    const maxSize = 100 * 1024 * 1024; // 100MB

    if (!file) {
        return { Result: false, Message: 'No file provided' };
    }

    if (!allowedMimes.includes(file.mimetype)) {
        return { Result: false, Message: 'Invalid video format. Allowed: MP4, MPEG, MOV, AVI, MKV, WebM' };
    }

    if (file.size > maxSize) {
        return { Result: false, Message: 'Video size exceeds 100MB limit' };
    }

    return { Result: true, Message: undefined };
};

export const validateFile = (file: Express.Multer.File): ReturnResult<boolean> => {
    const allowedMimes = [
        'text/plain',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/x-python',
        'application/javascript',
        'text/typescript',
        'text/x-c++src',
        'text/x-java-source',
        'text/x-csharp',
        'application/xml',
        'application/json',
        'text/html',
        'text/css'
    ];
    const allowedExtensions = ['.txt', '.pdf', '.doc', '.docx', '.py', '.js', '.ts', '.cpp', '.java', '.cs', '.xml', '.json', '.html', '.css'];
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (!file) {
        return { Result: false, Message: 'No file provided' };
    }

    const fileExtension = '.' + file.originalname.split('.').pop()?.toLowerCase();

    if (!allowedMimes.includes(file.mimetype) && !allowedExtensions.includes(fileExtension)) {
        return { Result: false, Message: `Invalid file format. Allowed: ${allowedExtensions.join(', ')}` };
    }

    if (file.size > maxSize) {
        return { Result: false, Message: 'File size exceeds 50MB limit' };
    }

    return { Result: true, Message: undefined };
};

export const validateUploadByType = (file: Express.Multer.File): ReturnResult<boolean> => {

    if (file.mimetype.startsWith('image/')) {
        return validateImage(file);
    } else if (file.mimetype.startsWith('video/')) {
        return validateVideo(file);
    } else {
        return validateFile(file);
    }
};