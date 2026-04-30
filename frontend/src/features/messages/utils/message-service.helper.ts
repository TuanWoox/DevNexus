import { Chat } from "../types/contracts";

export function toRelativeTime(isoDate: string): string {
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);
    if (diffMin < 1) return "now";
    if (diffMin < 60) return `${diffMin}m`;
    if (diffHr < 24) return `${diffHr}h`;
    if (diffDay < 7) return `${diffDay}d`;
    return new Date(isoDate).toLocaleDateString([], { month: "short", day: "numeric" });
}

export function getTitle(chat: Chat, currentProfileId: string): string {
    if (chat.IsGroup) {
        return chat.Name || "Group Chat";
    }
    // For 1-on-1 chats, get the other person's name
    const otherMember = chat.Members.find(m => m.MemberId !== currentProfileId);
    return otherMember?.Member?.FullName || chat.Name || "Direct Message";
}

export function getInitials(name: string): string {
    return name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase();
}

export function getAvatarUrl(chat: Chat, currentProfileId: string): string | undefined {
    if (chat.ChatPictureUrl) return chat.ChatPictureUrl;

    // For 1-on-1 chats, use the other person's avatar
    if (!chat.IsGroup) {
        const otherMember = chat.Members.find(m => m.MemberId !== currentProfileId);
        return otherMember?.Member?.AvatarUrl || undefined;
    }

    return undefined;
}

export function getProfileId(rawProfileId?: string): string {
    return rawProfileId || "";
}



export function formatTime(isoDate: string): string {
    return new Date(isoDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function isSameDay(a: string, b: string): boolean {
    const da = new Date(a);
    const db = new Date(b);
    return (
        da.getFullYear() === db.getFullYear() &&
        da.getMonth() === db.getMonth() &&
        da.getDate() === db.getDate()
    );
}

export function formatDaySeparator(isoDate: string): string {
    const d = new Date(isoDate);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (isSameDay(isoDate, today.toISOString())) return "Today";
    if (isSameDay(isoDate, yesterday.toISOString())) return "Yesterday";

    return d.toLocaleDateString([], {
        weekday: "long",
        month: "long",
        day: "numeric",
    });
}