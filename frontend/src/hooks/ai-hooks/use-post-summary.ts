import { useMutation } from '@tanstack/react-query';
import { aiContentService } from '@/services/ai-content-service';
import { SummarizePostRequestDTO } from '@/types/ai/post-summary-dto';

export const useSummarizePost = () => {
  return useMutation({
    mutationFn: ({
      postId,
      payload,
    }: {
      postId: string;
      payload: SummarizePostRequestDTO;
    }) => aiContentService.summarizePost(postId, payload),
  });
};
