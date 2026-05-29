"use client";

import { useState, useEffect } from "react";
import { FileQuestion, FileText, Loader2, Users, User, Tags as TagsIcon, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { CommunitySelectModal } from "./community-select-modal";
import { useCreatePostShare } from "@/hooks/post-hooks/use-create-post-share";
import { useCreateQAPostShare } from "@/hooks/qa-post-hooks/use-create-qa-post-share";
import { PostType } from "@/types/post/create-post-dto";
import { SelectPostDTO } from "@/types/post/select-post-dto";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { UserAvatar } from "@/components/shared/user-avatar";
import { MarkdownEditor } from "@/components/editor/markdown-editor";
import { useGetProfileById } from "@/hooks/profile-hooks/use-get-profile-by-id";
import { AiMetadataAssist } from "@/components/post/ai-metadata-assist";
import { getPostDetailHref, getQAPostDetailHref } from "@/utils/content-routes";

interface SharePostDialogProps {
    post: SelectPostDTO;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type ShareAs = "post" | "question";
type Destination = "wall" | "community";

export function SharePostDialog({ post, open, onOpenChange }: SharePostDialogProps) {
    const router = useRouter();
    const [shareAs, setShareAs] = useState<ShareAs>("post");
    const [destination, setDestination] = useState<Destination>("wall");
    const [title, setTitle] = useState(`Shared: ${post.title}`);
    const [content, setContent] = useState("");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");
    const [community, setCommunity] = useState<{ id: string; name: string } | null>(null);
    const [isCommunityPickerOpen, setIsCommunityPickerOpen] = useState(false);

    const user = useSelector((state: RootState) => state.auth.user);
    const { data: profile } = useGetProfileById(user?.profileId || "");

    useEffect(() => {
        if (!open) {
            document.body.style.pointerEvents = "";
            document.body.style.overflow = "";
            document.documentElement.style.pointerEvents = "";
            document.documentElement.style.overflow = "";
        }
        return () => {
            document.body.style.pointerEvents = "";
            document.body.style.overflow = "";
            document.documentElement.style.pointerEvents = "";
            document.documentElement.style.overflow = "";
        };
    }, [open]);

    const createPostShare = useCreatePostShare();
    const createQAPostShare = useCreateQAPostShare();
    const isPending = createPostShare.isPending || createQAPostShare.isPending;
    
    const canSubmit = title.trim().length >= 3 &&
        content.trim().length >= 10 &&
        (destination === "wall" || community?.id);

    const tagNames = selectedTags;

    const handleApplyMetadataSuggestion = (suggestion: { title: string; tags: string[] }) => {
        setTitle(suggestion.title);
        setSelectedTags(suggestion.tags.slice(0, 5));
    };

    const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && tagInput.trim() !== "") {
            e.preventDefault();
            const newTag = tagInput.trim().toLowerCase();
            if (!selectedTags.includes(newTag) && selectedTags.length < 5) {
                setSelectedTags([...selectedTags, newTag]);
            }
            setTagInput("");
        }
    };

    const removeTag = (tagToRemove: string) => {
        setSelectedTags(selectedTags.filter((tag) => tag !== tagToRemove));
    };

    const submit = () => {
        const payload = {
            title: title.trim(),
            content: content.trim(),
            postType: PostType.MarkDown,
            tagNames,
            communityId: destination === "community" ? community?.id : undefined,
            sharedPostId: post.id,
        };

        if (shareAs === "question") {
            createQAPostShare.mutate(payload, {
                onSuccess: (createdQuestion) => {
                    onOpenChange(false);
                    router.push(getQAPostDetailHref(createdQuestion));
                },
            });
        } else {
            createPostShare.mutate(payload, {
                onSuccess: (createdPost) => {
                    onOpenChange(false);
                    router.push(getPostDetailHref(createdPost));
                },
            });
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent 
                    className="max-h-[95vh] overflow-y-auto w-[95vw] sm:w-[90vw] md:max-w-[850px] lg:max-w-[950px] p-6"
                    onPointerDownOutside={(e) => e.preventDefault()}
                >
                    <DialogHeader className="border-b border-default pb-4">
                        <DialogTitle className="text-lg font-bold tracking-tight text-heading">
                            Share Post
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 pt-4">
                        {/* Profile Header */}
                        <div className="flex items-center gap-3 border-b border-border/40 pb-4">
                            <UserAvatar
                                avatarUrl={profile?.avatarUrl}
                                fullName={profile?.fullName || user?.userName}
                                size="lg"
                                className="h-10 w-10 shrink-0 border border-default shadow-xs"
                            />
                            <div className="flex flex-col min-w-0">
                                <h4 className="font-bold text-heading text-sm leading-tight">
                                    {profile?.fullName || user?.userName || "Anonymous"}
                                </h4>
                                <span className="text-xs text-muted-foreground mt-0.5">
                                    Compose your shared post
                                </span>
                            </div>
                        </div>

                        {/* Selector Zone */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            {/* Share As Format Switcher */}
                            <div className="flex-1 space-y-1.5">
                                <label className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider block pl-1">
                                    Format
                                </label>
                                <div className="flex bg-muted/45 p-1 rounded-xl border border-border/40">
                                    <button
                                        type="button"
                                        onClick={() => setShareAs("post")}
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer",
                                            shareAs === "post"
                                                ? "bg-card text-heading shadow-2xs border border-border/10"
                                                : "text-muted-foreground hover:text-heading"
                                        )}
                                    >
                                        <FileText className="h-3.5 w-3.5" />
                                        <span>Post</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShareAs("question")}
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer",
                                            shareAs === "question"
                                                ? "bg-card text-heading shadow-2xs border border-border/10"
                                                : "text-muted-foreground hover:text-heading"
                                        )}
                                    >
                                        <FileQuestion className="h-3.5 w-3.5" />
                                        <span>Question</span>
                                    </button>
                                </div>
                            </div>

                            {/* Share Destination Switcher */}
                            <div className="flex-1 space-y-1.5">
                                <label className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider block pl-1">
                                    Share To
                                </label>
                                <div className="flex bg-muted/45 p-1 rounded-xl border border-border/40">
                                    <button
                                        type="button"
                                        onClick={() => setDestination("wall")}
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer",
                                            destination === "wall"
                                                ? "bg-card text-heading shadow-2xs border border-border/10"
                                                : "text-muted-foreground hover:text-heading"
                                        )}
                                    >
                                        <User className="h-3.5 w-3.5" />
                                        <span>My Wall</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDestination("community")}
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer",
                                            destination === "community"
                                                ? "bg-card text-heading shadow-2xs border border-border/10"
                                                : "text-muted-foreground hover:text-heading"
                                        )}
                                    >
                                        <Users className="h-3.5 w-3.5" />
                                        <span>Community</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Destination community select trigger if community is selected */}
                        {destination === "community" && (
                            <div className="animate-fade-in space-y-1.5 pt-1">
                                <label className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider block pl-1">
                                    Target Community
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setIsCommunityPickerOpen(true)}
                                    className="flex w-full items-center justify-between h-9 px-3.5 rounded-xl border border-border bg-page hover:bg-muted/50 text-xs font-semibold text-heading transition-all duration-200 cursor-pointer"
                                >
                                    <div className="flex items-center gap-2">
                                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span>{community?.name ?? "Choose a community..."}</span>
                                    </div>
                                    {community?.id ? (
                                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                            Change Community
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-bold text-primary">
                                            Browse Communities
                                        </span>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* Title input */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Title</label>
                            <Input
                                value={title}
                                onChange={(event) => setTitle(event.target.value)}
                                maxLength={500}
                                placeholder="Give your shared post a title..."
                                className="h-9 bg-page border border-default focus-visible:ring-primary/20 focus-visible:border-primary transition-all text-sm font-semibold rounded-lg shadow-none"
                            />
                        </div>

                        {/* Markdown Editor Zone */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Your Thoughts</label>
                            <div className="rounded-lg overflow-hidden border border-default bg-page shadow-2xs focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                                <MarkdownEditor
                                    value={content}
                                    onChange={(val?: string) => setContent(val || "")}
                                    height={160}
                                />
                            </div>
                        </div>

                        {/* AI Metadata Assistant */}
                        <div className="pt-1">
                            <AiMetadataAssist
                                content={content || ""}
                                currentTitle={title || ""}
                                currentTags={tagNames}
                                isSubmitting={isPending}
                                onApply={handleApplyMetadataSuggestion}
                            />
                        </div>

                        {/* Tags Input Zone */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <TagsIcon className="w-3.5 h-3.5 text-primary" />
                                Tags <span className="text-[9px] font-normal text-muted-foreground/80 lowercase">(Max 5, press Enter to add)</span>
                            </label>
                            <div className="p-1.5 min-h-[38px] border border-default bg-page flex flex-wrap gap-1.5 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all items-center rounded-lg">
                                {selectedTags.map((tag) => (
                                    <span key={tag} className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 animate-scale-in">
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() => removeTag(tag)}
                                            className="hover:text-red-500 transition-colors cursor-pointer"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                                <input
                                    type="text"
                                    className="flex-1 bg-transparent border-none outline-none min-w-[120px] text-xs text-heading placeholder:text-muted-foreground/75 px-1.5 h-6"
                                    placeholder={selectedTags.length < 5 ? "Type and press Enter..." : "Max tags reached"}
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={handleAddTag}
                                    disabled={selectedTags.length >= 5}
                                />
                            </div>
                        </div>



                        {/* Actions */}
                        <div className="flex justify-end gap-2 pt-3 border-t border-default">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                                Cancel
                            </Button>
                            <Button type="button" onClick={submit} disabled={!canSubmit || isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4">
                                {isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                                Share Post
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <CommunitySelectModal
                isOpen={isCommunityPickerOpen}
                onClose={() => setIsCommunityPickerOpen(false)}
                selectedId={community?.id}
                onSelect={(id, name) => setCommunity({ id, name })}
            />
        </>
    );
}

