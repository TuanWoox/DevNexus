import PostHeader from '@/components/post/post-header';
import PostArticle from '@/components/post/post-article';
import CommentSection from '@/components/post/comment-section';

// 1. Thêm 'async' vào component và cập nhật type của params thành Promise
export default async function QuestionDetailPage({
    params
}: {
    params: Promise<{ questionId: string }>
}) {
    // 2. Dùng await để giải quyết (unwrap) Promise
    const resolvedParams = await params;
    const qaPostId = resolvedParams.questionId;

    if (!qaPostId) {
        return <div className="p-6 text-center text-muted-foreground">{`Post ${qaPostId} doesn't exist.`}</div>;
    }

    return (
        <div className="w-full mx-auto pb-8">
            <PostHeader />
            <PostArticle postId={qaPostId} isQAPost={true} />
            <CommentSection postId={qaPostId} isQAPost={true} />
        </div>
    );
}