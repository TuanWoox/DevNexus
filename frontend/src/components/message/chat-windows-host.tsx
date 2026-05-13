"use client";

import { useChatWindows } from "@/features/messages/context/chat-windows-context";
import { ChatPopupWindow } from "@/components/message/chat-popup-window";
import { NewChatPopupWindow } from "@/components/message/new-chat-popup-window";
import { ChatHead } from "@/components/message/chat-head";

const WINDOW_W = 340;
const WINDOW_GAP = 12;

export function ChatWindowsHost() {
    const { windows } = useChatWindows();
    if (!windows.length) return null;

    const openWindows = windows.filter(w => w.state === "open");
    const minimizedWindows = windows.filter(w => w.state === "minimized");

    // Chat heads sit directly to the left of the open windows stack
    const chatHeadsRight = openWindows.length > 0
        ? openWindows.length * (WINDOW_W + WINDOW_GAP) + 16
        : 16;

    return (
        <>
            {openWindows.length > 0 && (
                <div className="fixed bottom-0 right-4 z-40 flex items-end gap-3 pointer-events-none">
                    {openWindows.map(w => (
                        <div key={w.chatId} className="pointer-events-auto">
                            {w.type === "new" && w.profileData ? (
                                <NewChatPopupWindow targetProfile={w.profileData} />
                            ) : (
                                <ChatPopupWindow chatId={w.chatId} />
                            )}
                        </div>
                    ))}
                </div>
            )}

            {minimizedWindows.length > 0 && (
                <div
                    className="fixed bottom-4 z-40 flex flex-col-reverse gap-2 pointer-events-none"
                    style={{ right: `${chatHeadsRight}px` }}
                >
                    {minimizedWindows.map(w => (
                        <div key={w.chatId} className="pointer-events-auto">
                            {w.type === "new" && w.profileData ? (
                                <ChatHead chatId={w.chatId} title={w.profileData.fullName} avatarUrl={w.profileData.avatarUrl} />
                            ) : (
                                <ChatHead chatId={w.chatId} />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}
