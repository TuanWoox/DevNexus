import { AdminAiUsageSummaryDTO } from '@/types/admin/ai-usage-dto'
import { Sparkles } from 'lucide-react'

interface AiUsageSummaryCardsProps {
  summary: AdminAiUsageSummaryDTO
}

const metrics = (summary: AdminAiUsageSummaryDTO) => [
  { label: 'Total Calls', value: summary.total_calls },
  { label: 'Input Tokens', value: summary.total_input_tokens },
  { label: 'Output Tokens', value: summary.total_output_tokens },
  { label: 'Total Tokens', value: summary.total_tokens },
]

export function AiUsageSummaryCards({ summary }: AiUsageSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {metrics(summary).map(({ label, value }) => (
        <div key={label} className="card-ai p-4">
          <div className="pb-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                {label}
              </p>
              <Sparkles className="w-3.5 h-3.5 text-ai" />
            </div>
          </div>
          <p className="text-3xl font-bold text-heading">
            {(value ?? 0).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  )
}
