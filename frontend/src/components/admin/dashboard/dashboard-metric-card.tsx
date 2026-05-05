import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DashboardMetricCardProps {
  title: string;
  value: number;
  description?: string;
  variant?: 'default' | 'warning' | 'danger' | 'success';
}

const variantValueClass: Record<NonNullable<DashboardMetricCardProps['variant']>, string> = {
  default: 'text-foreground',
  warning: 'text-amber-500',
  danger: 'text-destructive',
  success: 'text-emerald-500',
};

export function DashboardMetricCard({
  title,
  value,
  description,
  variant = 'default',
}: DashboardMetricCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={cn('text-3xl font-semibold', variantValueClass[variant])}>
          {value.toLocaleString()}
        </p>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
