import type { LucideIcon } from 'lucide-react'
import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

type MetricDataCardProps = {
  variant?: 'metric'
  title: string
  value: string
  description: string
  icon: LucideIcon
  evolution: {
    value: string
    direction: 'positive' | 'negative'
  }
}

type ProgressDataCardProps = {
  variant: 'progress'
  title: string
  value: string
  description: string
  icon: LucideIcon
  progress: number
}

export type DataCardProps = MetricDataCardProps | ProgressDataCardProps

function MetricDataCard({
  title,
  value,
  description,
  icon: Icon,
  evolution,
}: MetricDataCardProps) {
  const TrendIcon =
    evolution.direction === 'positive' ? TrendingUpIcon : TrendingDownIcon

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardAction>
          <Icon />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3">
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          <Badge
            variant={
              evolution.direction === 'negative' ? 'destructive' : 'outline'
            }
          >
            <TrendIcon data-icon="inline-start" />
            {evolution.value}
          </Badge>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </Card>
  )
}

function ProgressDataCard({
  title,
  value,
  description,
  icon: Icon,
  progress,
}: ProgressDataCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardAction>
          <Icon />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-3xl font-bold tracking-tight text-warning">{value}</p>
        <Progress
          value={progress}
          className="h-2 [&_[data-slot=progress-indicator]]:bg-warning"
        />
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </Card>
  )
}

export function DataCard(props: DataCardProps) {
  if (props.variant === 'progress') {
    return <ProgressDataCard {...props} />
  }

  return <MetricDataCard {...props} />
}
