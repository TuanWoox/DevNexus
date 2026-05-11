import { PostForm } from '@/components/post/post-form'

export default async function CreatePostPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const sParams = await searchParams;
    const initialData = {
        communityId: sParams.communityId as string,
        communityName: sParams.communityName as string,
        communityIconUrl: sParams.communityIconUrl as string,
    };

    const fixedPostType = sParams.type === 'qa' ? 'qa-post' : 'post';

    return <PostForm initialData={initialData as any} fixedPostType={fixedPostType} />
}