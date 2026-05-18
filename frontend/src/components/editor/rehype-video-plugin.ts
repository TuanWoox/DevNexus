type HastNode = {
    type?: string;
    tagName?: string;
    properties?: Record<string, unknown>;
    children?: HastNode[];
};

const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv'];

function isVideoImage(node: HastNode): boolean {
    const src = String(node.properties?.src || '').toLowerCase();
    const alt = String(node.properties?.alt || '').toLowerCase();
    return alt === 'video' || VIDEO_EXTENSIONS.some((extension) => src.includes(extension));
}

export function rehypeVideoPlugin() {
    return (tree: HastNode) => {
        const visit = (node: HastNode) => {
            if (node.type === 'element' && node.tagName === 'img' && node.properties?.src && isVideoImage(node)) {
                node.tagName = 'video';
                node.properties = {
                    src: node.properties.src,
                    controls: true,
                    style: 'display: block; width: min(100%, 840px); max-height: 480px; height: auto; object-fit: contain; border-radius: 0.75rem; margin: 0.75rem auto 0;'
                };
                node.children = [];
            }

            node.children?.forEach(visit);
        };

        visit(tree);
    };
}
