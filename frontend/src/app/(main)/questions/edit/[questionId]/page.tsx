'use client'

import { useParams } from 'next/navigation'
import { PostForm } from '@/components/post/post-form'
import { useGetQAPostById } from '@/hooks/qa-post-hooks/use-get-qa-post-by-id'

export default function EditQAPostPage() {
    const params = useParams();
    const questionId = params.questionId as string;

    const { data: post, isLoading } = useGetQAPostById(questionId);

    if (isLoading) return (
        <div className="flex justify-center items-center h-[50vh]">
            <div className="w-8 h-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin"></div>
        </div>
    );

    if (!post) return (
        <div className="text-center p-10 text-destructive font-bold">
            Question not found or has been deleted.
        </div>
    );

    const initialData = {
        id: post.id,
        title: post.title,
        content: post.content,
        postType: post.postType,
        tags: post.tagNames || [],
        communityId: post.communityId || undefined
    };

    return <PostForm isEditMode initialData={initialData} fixedPostType="qa-post" />
}
