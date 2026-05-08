import { MessageSquareDashed } from "lucide-react";

interface MessageEmptyStateProps {
    title: string;
    description: string;
}

export function MessageEmptyState({ title, description }: MessageEmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border/80 p-10 text-center bg-muted/20">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/5 ring-1 ring-primary/10">
                <MessageSquareDashed className="h-6 w-6 text-primary/40" strokeWidth={1.5} />
            </div>
            <div>
                <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{description}</p>
            </div>
        </div>
    );
}
