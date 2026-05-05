import { AdminAiUsageSummaryDTO } from '@/types/admin/ai-usage-dto';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AiUsageSummaryCardsProps {
  summary: AdminAiUsageSummaryDTO;
}

const metrics = (summary: AdminAiUsageSummaryDTO) => [
  { label: 'Total Calls', value: summary.total_calls },
  { label: 'Input Tokens', value: summary.total_input_tokens },
  { label: 'Output Tokens', value: summary.total_output_tokens },
  { label: 'Total Tokens', value: summary.total_tokens },
];

export function AiUsageSummaryCards({ summary }: AiUsageSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {metrics(summary).map(({ label, value }) => (
        <Card key={label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">
              {label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-foreground">
              {(value ?? 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
