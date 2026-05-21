import PostHeader from '@/components/post/post-header';
import PostArticle from '@/components/post/post-article';
import CommentSection from '@/components/post/comment-section';

import PostNotFound from '@/components/post/post-not-found';

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
        return <PostNotFound />;
    }

    return (
        <div className="w-full mx-auto pb-8">
            <PostArticle postId={qaPostId} isQAPost={true} />
            <CommentSection postId={qaPostId} isQAPost={true} />
        </div>
    );
}