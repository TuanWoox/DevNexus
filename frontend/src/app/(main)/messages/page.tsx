import { MessageSquareDashed } from "lucide-react";

export default function MessagesPage() {
    return (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-border">
                <MessageSquareDashed className="h-7 w-7" strokeWidth={1.5} />
            </div>
            <div className="text-center">
                <p className="text-base font-semibold text-foreground">Your messages</p>
                <p className="mt-1 text-sm">Select a conversation to start chatting</p>
            </div>
        </div>
    );
}
