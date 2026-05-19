export async function computeFileHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function chunkFile(file: File, chunkSize = 5 * 1024 * 1024): File[] {
    const chunks: File[] = [];
    let offset = 0;

    while (offset < file.size) {
        const end = Math.min(offset + chunkSize, file.size);
        chunks.push(new File([file.slice(offset, end)], `${file.name}.part${chunks.length}`, { type: file.type }));
        offset = end;
    }

    return chunks;
}
