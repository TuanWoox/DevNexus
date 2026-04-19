'use client'

import { useParams } from 'next/navigation'
import { PostForm } from '@/components/post/post-form'
import { useGetPostById } from '@/hooks/post-hooks'

export default function EditPostPage() {
    const params = useParams();
    const postId = params.postId as string;
    
    const { data: post, isLoading } = useGetPostById(postId);

    if (isLoading) return (
        <div className="flex justify-center items-center h-[50vh]">
            <div className="w-8 h-8 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 animate-spin"></div>
        </div>
    );

    if (!post) return (
        <div className="text-center p-10 text-destructive font-bold">
            Post not found or has been deleted.
        </div>
    );

    const initialData = {
        id: post.id,
        title: post.title,
        content: post.content,
        postType: post.postType,
        tags: post.tagNames || [],
    };

    return <PostForm isEditMode initialData={initialData} fixedPostType="post" />
}
