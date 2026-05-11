import { Page } from './page';
import { CommunityFetchMode } from '@/constants/communityFetchMode';

export interface CommunityPageRequest extends Page<string> {
    fetchMode: CommunityFetchMode;
}
