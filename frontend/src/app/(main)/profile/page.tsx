"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useGetProfileById } from "@/hooks/profile-hooks/use-get-profile-by-id";
import { useGetPostsWithPagination } from "@/hooks/post-hooks/use-get-posts-with-pagination";
import { useGetQAPostsWithPagination } from "@/hooks/qa-post-hooks/use-get-qa-posts-with-pagination";
import { PostCard } from "@/components/post/post-card";
import { SortOrderType } from "@/constants/sortOrderType";
import { Loader2 } from "lucide-react";

const ProfilePage = () => {
    const [activeTab, setActiveTab] = useState<"overview" | "post" | "qa-post" | "saved">("overview");

    const { user } = useSelector((state: RootState) => state.auth);
    const { data: userProfile, isLoading: isProfileLoading } = useGetProfileById(user?.profileId as string);

    // Fetch Posts
    const { data: postsData, isLoading: isPostsLoading } = useGetPostsWithPagination({
        size: -1,
        pageNumber: 0,
        totalElements: 0,
        orders: [{ sort: 'dateCreated', sortDir: SortOrderType.DESC, dynamicProperty: '', delimiter: '', dataType: '' }],
        filter: [],
        selected: []
    });

    // Fetch QA Posts
    const { data: qaPostsData, isLoading: isQAPostsLoading } = useGetQAPostsWithPagination({
        size: -1,
        pageNumber: 0,
        totalElements: 0,
        orders: [{ sort: 'dateCreated', sortDir: SortOrderType.DESC, dynamicProperty: '', delimiter: '', dataType: '' }],
        filter: [],
        selected: []
    });

    if (isProfileLoading || !userProfile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground font-medium animate-pulse">Loading profile...</p>
            </div>
        );
    }

    const tabs = [
        { id: "overview", label: "Overview" },
        { id: "post", label: "Post" },
        { id: "qa-post", label: "QA Post" },
        { id: "saved", label: "Saved" },
    ];

    return (
        <div className="flex flex-col w-full min-h-screen pb-10">
            {/* Background / Cover Image */}
            <div className="w-full h-48 md:h-64 relative bg-muted">
                <Image
                    src={userProfile.backgroundUrl || "https://images.unsplash.com/photo-1707343843437-caacff5cfa74"}
                    alt="Cover Image"
                    fill
                    priority
                    unoptimized
                    className="object-cover"
                />
            </div>

            <div className="px-4 md:px-8 max-w-5xl mx-auto w-full">
                {/* Profile Header (Avatar and Actions) */}
                <div className="relative flex justify-between items-end -mt-16 md:-mt-20 mb-4">
                    <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-background overflow-hidden bg-muted flex items-center justify-center">
                        {userProfile.avatarUrl ? (
                            <Image
                                src={userProfile.avatarUrl}
                                alt="Avatar"
                                fill
                                unoptimized
                                className="object-cover"
                            />
                        ) : (
                            <span className="text-4xl text-primary font-bold">
                                {userProfile.fullName ? userProfile.fullName.charAt(0) : "U"}
                            </span>
                        )}
                    </div>

                    <div className="mb-2">
                        <Button variant="outline" size="lg">Edit Profile</Button>
                    </div>
                </div>

                {/* Profile Details */}
                <div className="mt-4">
                    <h1 className="text-2xl md:text-3xl font-bold">{userProfile.fullName || "User Name"}</h1>
                    <p className="text-muted-foreground">{user?.userName || "@username"}</p>
                    {userProfile.techStacks && userProfile.techStacks.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {userProfile.techStacks.map((tech) => (
                                <span key={tech} className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-md font-medium">
                                    {tech}
                                </span>
                            ))}
                        </div>
                    )}
                    <p className="mt-4 text-sm md:text-base max-w-2xl">{userProfile.bio || "No bio added yet."}</p>

                    <div className="flex items-center gap-6 mt-4 text-sm">
                        <div className="flex items-center gap-1 cursor-pointer hover:underline">
                            <span className="font-bold text-primary">{userProfile.reputationPoints || 0}</span>
                            <span className="text-muted-foreground">Reputation</span>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="mt-4 border-b ">
                    <nav className="flex space-x-8 overflow-x-auto no-scrollbar" aria-label="Tabs">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as "overview" | "post" | "qa-post" | "saved")}
                                className={`border-b-2 py-4 px-1 text-base font-semibold cursor-pointer whitespace-nowrap transition-colors ${activeTab === tab.id
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>


                {/* Content Area */}
                <div className="py-8">
                    {activeTab === "overview" && (
                        <div className="p-8 border border-dashed rounded-lg bg-card text-card-foreground text-center fade-in">
                            <h3 className="text-lg font-semibold mb-2">Welcome to {userProfile.fullName}'s profile!</h3>
                            <p className="text-muted-foreground">This is an overview of the recent activities.</p>
                        </div>
                    )}

                    {activeTab === "post" && (
                        <div className="flex flex-col gap-4 fade-in">
                            {isPostsLoading ? (
                                <div className="flex justify-center py-10">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                </div>
                            ) : postsData?.data && postsData.data.length > 0 ? (
                                postsData.data.map((post: any) => (
                                    <PostCard key={post.id} post={post} />
                                ))
                            ) : (
                                <div className="p-8 border border-dashed rounded-lg text-center">
                                    <p className="text-muted-foreground">No posts found.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "qa-post" && (
                        <div className="flex flex-col gap-4 fade-in">
                            {isQAPostsLoading ? (
                                <div className="flex justify-center py-10">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                </div>
                            ) : qaPostsData?.data && qaPostsData.data.length > 0 ? (
                                qaPostsData.data.map((qaPost: any) => (
                                    <PostCard key={qaPost.id} post={qaPost} />
                                ))
                            ) : (
                                <div className="p-8 border border-dashed rounded-lg text-center">
                                    <p className="text-muted-foreground">No Q&A posts found.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "saved" && (
                        <div className="p-8 border border-dashed rounded-lg bg-card text-card-foreground text-center fade-in">
                            <p className="text-muted-foreground">Saved items will be displayed here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};

export default ProfilePage;