'use client'

import { useState } from 'react'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { Sparkles, MessageSquare, HelpCircle, Tags as TagsIcon, Globe, PenTool, X, Send, AlertCircle, Save, ChevronDown } from 'lucide-react'
import { MarkdownEditor } from '@/components/editor/markdown-editor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { useCreatePost } from '@/hooks/post-hooks'
import { useCreateQAPost } from '@/hooks/qa-post-hooks/use-create-qa-post'
import { useUpdatePost } from '@/hooks/post-hooks/use-update-post'
import { useUpdateQAPost } from '@/hooks/qa-post-hooks/use-update-qa-post'
import { CreatePostDTO } from '@/types/post/create-post-dto'
import { CreateQAPostDTO } from '@/types/qa-post/create-qa-post-dto'
import { UpdatePostDTO } from '@/types/post/update-post-dto'
import { UpdateQAPostDTO } from '@/types/qa-post/update-qa-post-dto'
import { useRouter } from 'next/navigation'
import { CommunitySelectModal } from './community-select-modal'
import Image from 'next/image'

export type PostFormData = {
    title: string;
    content: string;
    postType: number;
    tags: string[];
    communityId: string;
}

export interface PostFormProps {
    initialData?: {
        id?: string;
        title?: string;
        content?: string;
        postType?: number;
        tags?: string[];
        communityId?: string;
        communityName?: string;
        communityIconUrl?: string;
    };
    isEditMode?: boolean;
    fixedPostType?: 'post' | 'qa-post';
}

export function PostForm({ initialData, isEditMode = false, fixedPostType }: PostFormProps) {
    const router = useRouter();

    // Khởi tạo isQAPost từ fixedPostType hoặc từ initialData.postType
    const [isQAPost, setIsQAPost] = useState<boolean>(() => {
        if (fixedPostType === 'qa-post') return true;
        if (fixedPostType === 'post') return false;
        return false;
    });

    const [tagInput, setTagInput] = useState('');
    const [isCommunityModalOpen, setIsCommunityModalOpen] = useState(false);
    const [selectedComm, setSelectedComm] = useState({
        name: initialData?.communityName || '',
        iconUrl: initialData?.communityIconUrl || ''
    });

    const { mutate: createPost, isPending: isCreatingPost } = useCreatePost();
    const { mutate: createQAPost, isPending: isCreatingQAPost } = useCreateQAPost();
    const { mutate: updatePost, isPending: isUpdatingPost } = useUpdatePost();
    const { mutate: updateQAPost, isPending: isUpdatingQAPost } = useUpdateQAPost();

    const isPending = isCreatingPost || isCreatingQAPost || isUpdatingPost || isUpdatingQAPost;

    const {
        register,
        control,
        handleSubmit,
        setValue,
        reset,
        formState: { errors }
    } = useForm<PostFormData>({
        defaultValues: {
            title: initialData?.title || '',
            content: initialData?.content || '',
            postType: initialData?.postType || 0,
            tags: initialData?.tags || [],
            communityId: initialData?.communityId || ''
        },
        mode: 'onTouched'
    })

    const selectedTags = useWatch({ control, name: 'tags' });
    const communityId = useWatch({ control, name: 'communityId' });

    // Đồng bộ isQAPost vào react-hook-form nếu nó thay đổi (chỉ khi không bị lock fixedPostType)
    const handleSetIsQAPost = (value: boolean) => {
        setIsQAPost(value);
    };

    const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && tagInput.trim() !== '') {
            e.preventDefault()
            const newTag = tagInput.trim().toLowerCase()
            if (!selectedTags.includes(newTag) && selectedTags.length < 5) {
                setValue('tags', [...selectedTags, newTag], { shouldValidate: true })
            }
            setTagInput('')
        }
    }

    const removeTag = (tagToRemove: string) => {
        setValue('tags', selectedTags.filter(tag => tag !== tagToRemove), { shouldValidate: true })
    }

    const handleCommunitySelect = (id: string, name: string, iconUrl?: string) => {
        setValue('communityId', id, { shouldValidate: true });
        setSelectedComm({ name, iconUrl: iconUrl || '' });
    };

    const onSubmit = (data: PostFormData) => {
        const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

        if (isEditMode && initialData) {
            handleEdit(data, slug);
        } else {
            handleCreate(data, slug);
        }
    }

    const handleEdit = (data: PostFormData, slug: string) => {
        const payload = {
            id: initialData!.id,
            title: data.title,
            content: data.content,
            postType: 0,
            slug,
            tagNames: data.tags,
            communityId: initialData?.communityId || undefined
        };

        if (isQAPost) {
            updateQAPost(payload as UpdateQAPostDTO, {
                onSuccess: () => router.push(`/questions/${initialData!.id}`)
            });
        } else {
            updatePost(payload as UpdatePostDTO, {
                onSuccess: () => router.push(`/post/${initialData!.id}`)
            });
        }
    };

    const handleCreate = (data: PostFormData, slug: string) => {
        const basePayload = {
            title: data.title,
            content: data.content,
            postType: 0,
            slug,
            tagNames: data.tags,
            ...(data.communityId && data.communityId !== "" ? { communityId: data.communityId } : {})
        };

        if (isQAPost) {
            createQAPost(basePayload as CreateQAPostDTO, {
                onSuccess: (res) => {
                    reset();
                    setTagInput('');
                    if (res?.id) router.push(`/questions/${res.id}`);
                }
            });
        } else {
            createPost(basePayload as CreatePostDTO, {
                onSuccess: (res) => {
                    reset();
                    setTagInput('');
                    if (res?.id) router.push(`/post/${res.id}`);
                }
            });
        }
    };

    return (
        <div className="w-full p-4 sm:p-6 animate-fade-in-up">
            {/* Header */}
            <div className="mb-4 relative auto-mx">
                <div className="absolute -inset-1 bg-linear-to-r from-emerald-400 to-cyan-400 blur-2xl opacity-20 dark:opacity-10 rounded-full animate-pulse-slow -z-10" />
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">
                    {isEditMode ? (
                        <>Edit <span className="text-ai-gradient">{isQAPost ? 'Q&A Post' : 'Standard Post'}</span></>
                    ) : (
                        <>Create a <span className="text-ai-gradient">New Post</span></>
                    )}
                </h1>
                <p className="text-muted-foreground text-base">
                    {isEditMode
                        ? 'Update your content and correct any mistakes.'
                        : 'Share your knowledge, ask questions, and engage with the Nexus community.'}
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

                {/* 1. Post Type Selector (Ẩn trong chế độ Edit) */}
                {!isEditMode && (
                    <div className="space-y-4">
                        <Label className="text-base font-semibold text-heading flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-emerald-500" />
                            Choose Post Type
                        </Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Normal Post Card */}
                            <div
                                onClick={() => handleSetIsQAPost(false)}
                                className={`cursor-pointer rounded-lg p-5 border-2 transition-all duration-200 ${!isQAPost
                                    ? 'border-emerald-500 bg-emerald-500/5 shadow-ai-md'
                                    : 'border-default bg-card hover:border-emerald-500/50 hover:bg-subtle'
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-lg ${!isQAPost ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                                        <MessageSquare className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-heading text-lg mb-1">Standard Post</h3>
                                        <p className="text-sm text-dimmed">Share an article, discussion, or a general thought.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Q&A Post Card */}
                            <div
                                onClick={() => handleSetIsQAPost(true)}
                                className={`cursor-pointer rounded-lg p-5 border-2 transition-all duration-200 ${isQAPost
                                    ? 'border-primary bg-primary/5 shadow-primary'
                                    : 'border-default bg-card hover:border-primary/50 hover:bg-subtle'
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-lg ${isQAPost ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                                        <HelpCircle className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-heading text-lg mb-1">Question & Answer</h3>
                                        <p className="text-sm text-dimmed">Ask a specific question to get answers and upvotes.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content Area */}
                <Card className="card overflow-visible">
                    <CardContent className="p-6 space-y-6">

                        {/* Title */}
                        <div className="space-y-3">
                            <Label htmlFor="title" className="text-base font-semibold text-heading flex items-center gap-2">
                                <PenTool className="w-4 h-4 text-emerald-500" />
                                Title <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="title"
                                placeholder={!isQAPost ? "What's on your mind? Be descriptive..." : "What is your programming question? Be specific..."}
                                className={`text-sm py-6 bg-page border-2 focus:bg-card transition-colors ${errors.title ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                                {...register('title', {
                                    required: "Title is required",
                                    minLength: { value: 3, message: "Title must be at least 3 characters" },
                                    maxLength: { value: 500, message: "Title cannot exceed 500 characters" }
                                })}
                            />
                            {errors.title && (
                                <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                                    <AlertCircle className="w-4 h-4" /> {errors.title.message}
                                </p>
                            )}
                        </div>

                        {/* Tags & Community Grid */}
                        <div className={`grid grid-cols-1 ${!isEditMode ? 'md:grid-cols-2' : ''} gap-6 items-start`}>

                            {/* Tags Input */}
                            <div className="space-y-3">
                                <Label htmlFor="tags" className="text-base font-semibold text-heading flex items-center gap-2">
                                    <TagsIcon className="w-4 h-4 text-indigo-500" />
                                    Tags <span className="text-xs font-normal text-dimmed">(Max 5)</span>
                                </Label>
                                <div className="p-2 min-h-13.5 border-2 border-default input bg-page flex flex-wrap gap-2 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20 transition-all items-center">
                                    {selectedTags?.map((tag) => (
                                        <span key={tag} className="badge-emerald animate-scale-in">
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => removeTag(tag)}
                                                className="ml-1 hover:text-red-200 transition-colors"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                    <input
                                        id="tags"
                                        type="text"
                                        className="flex-1 bg-transparent border-none outline-none min-w-30 text-sm text-heading placeholder:text-muted-foreground px-2"
                                        placeholder={(selectedTags || []).length < 5 ? "Type and press Enter..." : "Max tags reached"}
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={handleAddTag}
                                        disabled={(selectedTags || []).length >= 5}
                                    />
                                </div>
                            </div>

                            {/* Community Dropdown (Ẩn trong Edit mode vì không thể sửa) */}
                            {/* có thể cho hiện nhưng để disabled để user vẫn biết đc community chỉ là ko sửa đc */}
                            {!isEditMode && (
                                <div className="space-y-3">
                                    <Label htmlFor="community" className="text-base font-semibold text-heading flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-blue-500" />
                                        Community
                                    </Label>
                                    <div className="relative group">
                                        <div
                                            onClick={() => setIsCommunityModalOpen(true)}
                                            className={`input bg-page min-h-13.5 w-full cursor-pointer flex items-center justify-between px-4 hover:border-primary/50 transition-all active:scale-[0.99] border-2 ${communityId ? 'border-primary/20 bg-primary/5' : 'border-default'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 overflow-hidden">
                                                    {selectedComm.iconUrl ? (
                                                        <Image src={selectedComm.iconUrl} alt={selectedComm.name} width={32} height={32} unoptimized className="object-cover" />
                                                    ) : (
                                                        <Globe className={`w-4 h-4 ${communityId ? 'text-primary' : 'text-muted-foreground'}`} />
                                                    )}
                                                </div>
                                                <span className={`truncate ${communityId ? "font-bold text-heading" : "text-muted-foreground"}`}>
                                                    {selectedComm.name || "Select a community..."}
                                                </span>
                                            </div>
                                            <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-300 ${isCommunityModalOpen ? 'rotate-180' : ''}`} />
                                        </div>
                                        <input type="hidden" {...register('communityId')} />
                                    </div>
                                </div>
                            )}
                        </div>

                        <CommunitySelectModal
                            isOpen={isCommunityModalOpen}
                            onClose={() => setIsCommunityModalOpen(false)}
                            onSelect={handleCommunitySelect}
                            selectedId={communityId}
                        />

                        {/* Markdown Editor */}
                        <div className="space-y-3 pt-2">
                            <Label className="text-base font-semibold text-heading flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-emerald-500" />
                                Body Content <span className="text-destructive">*</span>
                            </Label>

                            <Controller
                                name="content"
                                control={control}
                                rules={{
                                    required: "Content is required",
                                    minLength: { value: 10, message: "Content must be at least 10 characters" },
                                    maxLength: { value: 50000, message: "Content cannot exceed 50000 characters" }
                                }}
                                render={({ field }) => (
                                    <div className={`rounded-lg overflow-hidden border ${errors.content ? 'border-destructive shadow-sm' : 'border-default shadow-sm'} focus-within:ring-2 focus-within:ring-ring focus-within:border-ring transition-all`}>
                                        <MarkdownEditor
                                            value={field.value}
                                            onChange={(val?: string) => field.onChange(val || '')}
                                            height={400}
                                        />
                                    </div>
                                )}
                            />
                            {errors.content && (
                                <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                                    <AlertCircle className="w-4 h-4" /> {errors.content.message}
                                </p>
                            )}
                        </div>

                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-end gap-4">
                    <Button
                        type="button"
                        variant="custom"
                        className="btn-secondary px-6 py-2 h-auto"
                        disabled={isPending}
                        onClick={() => router.back()}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" className="btn-ai text-white text-sm px-6 py-2 h-auto flex items-center gap-2 group" disabled={isPending}>
                        {isEditMode ? (
                            <Save className="w-4 h-4 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                        ) : (
                            <Send className="w-4 h-4 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                        )}
                        {isPending ? (isEditMode ? 'Saving...' : 'Publishing...') : (isEditMode ? 'Save Changes' : 'Publish Post')}
                    </Button>
                </div>
            </form>
        </div>
    )
}
