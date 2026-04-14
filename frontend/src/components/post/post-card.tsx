'use client';

import { useGetProfileById } from "@/hooks/profile-hooks/use-get-profile-by-id";
import { SelectPostDTO } from "@/types/post/select-post-dto";
import { Bookmark, Share2, MoreHorizontal, Flag, UserPlus, MessageSquare, ArrowBigUp, ArrowBigDown } from "lucide-react";
import Link from "next/link";
import { useUpdateVoteByPostId } from "@/hooks/vote-hooks/use-update-vote-by-post-id";
import { useState, useRef, useEffect } from "react";
import { SelectQAPostDTO } from "@/types/qa-post/select-qa-post-dto";

interface PostCardProps {
    post: SelectPostDTO | SelectQAPostDTO;
}

export function PostCard({ post }: PostCardProps) {
    const isQaPost = 'answerCount' in post;
    const basePath = isQaPost ? '/questions' : '/post';

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { data: author } = useGetProfileById(post?.authorId || '');

    const { mutate: updateVote, isPending: isVotePending } = useUpdateVoteByPostId(post.id);

    const handleVote = (e: React.MouseEvent, isUpvote: boolean) => {
        e.preventDefault();
        updateVote({ isUpvote });
    };

    // Xử lý sự kiện click ngoài dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Format ngày tạo bài
    const formattedDate = new Date(post.dateCreated).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });

    return (
        <div className="card card-hover p-3 sm:px-5 flex flex-col gap-3 relative animate-in fade-in slide-in-from-bottom-2">
            {/* Header: Author & Options */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0 overflow-hidden border border-default">
                        {author?.avatarUrl ? (
                            <img src={author.avatarUrl} alt={author.fullName} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-primary font-bold">{author?.fullName?.charAt(0) || 'U'}</span>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <Link href={`/profile/${post.authorId}`} className="text-sm font-bold text-heading hover:text-primary transition-colors">
                            {author?.fullName || 'Unknown'}
                        </Link>
                        <span className="text-xs text-muted-foreground">{formattedDate}</span>
                    </div>
                </div>

                {/* Dropdown Menu Options */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={(e) => { e.preventDefault(); setIsMenuOpen(!isMenuOpen); }}
                        className="p-2 text-muted-foreground hover:text-primary hover:bg-subtle rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label="More options"
                    >
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                    {isMenuOpen && (
                        <div className="absolute right-0 w-34 mt-1 bg-card border rounded-xl shadow-elevated p-1 z-10 animate-in fade-in zoom-in-95">
                            <button className="w-full flex items-center gap-2 p-2.5 text-sm text-body hover:bg-subtle hover:text-heading rounded-lg transition-colors text-left font-medium">
                                <UserPlus className="w-4 h-4" />
                                Follow User
                            </button>
                            <button className="w-full flex items-center gap-2 p-2.5 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors text-left font-medium">
                                <Flag className="w-4 h-4" />
                                Report Post
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Wrap in Link */}
            <Link href={`${basePath}/${post.id}`} className="block mt-1 group">
                <h2 className="text-lg sm:text-xl font-bold text-heading group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                    {post.title}
                </h2>
                <p className="mt-2.5 text-sm sm:text-base text-body line-clamp-3 leading-relaxed">
                    {post.content}
                </p>
            </Link>

            {/* Tags Tags */}
            {post.tagNames && post.tagNames.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1.5">
                    {post.tagNames.map((tag, idx) => (
                        <span key={idx} className="badge-default">
                            #{tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Interaction Actions */}
            {/* <div className="flex items-center justify-between mt-2 border-t pt-3"> */}
            <div className="pt-3 border-t flex items-center justify-between bg-subtle/30">
                <div className="flex items-center gap-1 sm:gap-2">
                    {/* Upvote & Downvote Wrapper */}
                    <div className="flex items-center bg-subtle rounded-full border border-default p-0.5">
                        <button
                            onClick={(e) => handleVote(e, true)}
                            disabled={isVotePending}
                            className="p-1.5 sm:p-2 text-muted-foreground hover:text-emerald-500 disabled:opacity-50 rounded-full hover:bg-page transition-colors flex items-center gap-1.5 group"
                        >
                            <ArrowBigUp className="w-5 h-5 group-hover:fill-emerald-500/20" />
                            <span className="text-sm font-medium pr-1">{post.upvoteCount}</span>
                        </button>
                        <div className="w-px h-5 bg-default mx-0.5"></div>
                        <button
                            onClick={(e) => handleVote(e, false)}
                            disabled={isVotePending}
                            className="p-1.5 sm:p-2 text-muted-foreground hover:text-rose-500 disabled:opacity-50 rounded-full hover:bg-page transition-colors flex items-center gap-1.5 group"
                        >
                            <span className="text-sm font-medium pr-1">{post.downvoteCount}</span>
                            <ArrowBigDown className="w-5 h-5 group-hover:fill-rose-500/20" />
                        </button>
                    </div>

                    {/* Comments/Answers */}
                    {isQaPost ? (
                        <button className="flex items-center gap-2 p-2 sm:px-3 sm:py-2 text-muted-foreground hover:text-heading hover:bg-subtle rounded-full sm:rounded-lg transition-colors">
                            <MessageSquare className="w-5 h-5" />
                            <span className="text-sm font-medium hidden sm:block">{`${post.answerCount}`} Answers</span>
                        </button>
                    ) : (
                        <button className="flex items-center gap-2 p-2 sm:px-3 sm:py-2 text-muted-foreground hover:text-heading hover:bg-subtle rounded-full sm:rounded-lg transition-colors">
                            <MessageSquare className="w-5 h-5" />
                            <span className="text-sm font-medium hidden sm:block">Comments</span>
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                    <button className="p-2 sm:px-3 sm:py-2 text-muted-foreground hover:text-primary hover:bg-subtle rounded-full sm:rounded-lg transition-colors flex items-center gap-2">
                        <Bookmark className="w-5 h-5" />
                        <span className="text-sm font-medium hidden sm:block">Save</span>
                    </button>
                    <button className="p-2 sm:px-3 sm:py-2 text-muted-foreground hover:text-heading hover:bg-subtle rounded-full sm:rounded-lg transition-colors flex items-center gap-2">
                        <Share2 className="w-5 h-5" />
                        <span className="text-sm font-medium hidden sm:block">Share</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
