import PostHeader from '@/components/post/post-header';
import PostArticle from '@/components/post/post-article';
import CommentSection from '@/components/post/comment-section';

// 1. Thêm 'async' vào component và cập nhật type của params thành Promise
export default async function PostDetailPage({
    params
}: {
    params: Promise<{ postId: string }>
}) {
    // 2. Dùng await để giải quyết (unwrap) Promise
    const resolvedParams = await params;
    const postId = resolvedParams.postId;

    if (!postId) {
        return <div className="p-6 text-center text-muted-foreground">{`Post ${postId} doesn't exist.`}</div>;
    }

    return (
        <div className="w-full mx-auto pb-8">
            <PostHeader />
            <PostArticle postId={postId} isQAPost={false} />
            <CommentSection postId={postId} isQAPost={false} />
        </div>
    );
}