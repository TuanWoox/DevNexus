import { Sparkles } from 'lucide-react';
import { AnswerItem } from './answer-item';
import { SelectAnswerDTO } from '@/types/answer/select-answer-dto';
import { ModerationStatus } from '@/types/post/moderation-status';

interface AIAnswerSectionProps {
    answers: SelectAnswerDTO[];
    currentUserId: string;
    currentUserAvatar?: string;
    isDisabled?: boolean;
    moderationStatus?: ModerationStatus;
    isQuestionAuthor?: boolean;
    communityId?: string | null;
    canModerateCommunity?: boolean;
    context?: "personal" | "community";
}

export function AIAnswerSection({
    answers,
    currentUserId,
    currentUserAvatar,
    isDisabled,
    moderationStatus,
    isQuestionAuthor,
    communityId,
    canModerateCommunity,
    context = "personal",
}: AIAnswerSectionProps) {
    if (answers.length === 0) {
        return null;
    }

    return (
        <section className="space-y-4">
            <div className="flex flex-col gap-3 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/5 to-cyan-500/5 border border-emerald-500/15 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-heading">AI Answer</h4>
                            <span className="badge-ai text-[10px] font-semibold tracking-wider uppercase">Assistant</span>
                        </div>
                    </div>
                </div>
                <p className="text-xs font-medium text-emerald-700/85 dark:text-emerald-400/85">
                    Use this as a starting point and verify it with community answers.
                </p>
            </div>

            <div className="space-y-6">
                {answers.map((answer) => (
                    <AnswerItem
                        key={answer.id}
                        answer={answer}
                        currentUserId={currentUserId}
                        currentUserAvatar={currentUserAvatar}
                        isDisabled={isDisabled}
                        moderationStatus={moderationStatus}
                        isQuestionAuthor={isQuestionAuthor}
                        communityId={communityId}
                        canModerateCommunity={canModerateCommunity}
                        context={context}
                    />
                ))}
            </div>
        </section>
    );
}
