interface MessageEmptyStateProps {
    title: string;
    description: string;
}

export function MessageEmptyState({ title, description }: MessageEmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border p-8 text-center">
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground">{description}</p>
        </div>
    );
}
