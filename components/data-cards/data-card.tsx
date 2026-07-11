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
import { cn } from '@/lib/utils'

type MetricDataCardProps = {
  variant?: 'metric'
  title: string
  value: string
  description: string
  icon: LucideIcon
  evolution?: {
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

const cardClassName = 'h-full border border-border shadow-sm ring-0'

const iconClassName = 'size-3.5 text-muted-foreground'

function MetricDataCard({
  title,
  value,
  description,
  icon: Icon,
  evolution,
}: MetricDataCardProps) {
  const TrendIcon = evolution
    ? evolution.direction === 'positive'
      ? TrendingUpIcon
      : TrendingDownIcon
    : TrendingUpIcon

  return (
    <Card size="sm" className={cardClassName}>
      <CardHeader className="pb-0">
        <CardTitle className="font-normal text-muted-foreground">
          {title}
        </CardTitle>
        <CardAction>
          <Icon className={iconClassName} />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="flex flex-wrap items-baseline gap-2">
          <p className="text-2xl font-semibold tracking-tight">{value}</p>

          {evolution && (
            <Badge variant="secondary" className="h-5 px-2 font-normal">
              <TrendIcon data-icon="inline-start" />
              {evolution.value}
            </Badge>
          )}
        </div>
        <CardDescription className="text-xs">{description}</CardDescription>
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
    <Card size="sm" className={cardClassName}>
      <CardHeader className="pb-0">
        <CardTitle className="font-normal text-muted-foreground">
          {title}
        </CardTitle>
        <CardAction>
          <Icon className={iconClassName} />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <p className="text-2xl font-semibold tracking-tight text-warning">
          {value}
        </p>
        <Progress
          value={progress}
          className="[&_[data-slot=progress-indicator]]:bg-warning"
        />
        <CardDescription className="text-xs">{description}</CardDescription>
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

export function DataCardSkeleton() {
  return (
    <Card size="sm" className={cn(cardClassName, 'animate-pulse')}>
      <CardHeader className="pb-0">
        <div className="h-3.5 w-24 rounded bg-muted" />
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="h-7 w-28 rounded bg-muted" />
        <div className="h-3 w-36 rounded bg-muted" />
      </CardContent>
    </Card>
  )
}
