import { TagStatDTO } from '@/types/admin/admin-dashboard-dto';

interface DashboardTopTagsProps {
  tags: TagStatDTO[];
}

export function DashboardTopTags({ tags }: DashboardTopTagsProps) {
  if (tags.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-muted-foreground">No tags yet</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {tags.map((tag) => (
        <li
          key={tag.tagName}
          className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/40"
        >
          <span className="text-sm font-semibold text-heading">{tag.tagName}</span>
          <span className="badge-default text-xs">{tag.postCount.toLocaleString()} posts</span>
        </li>
      ))}
    </ul>
  );
}
