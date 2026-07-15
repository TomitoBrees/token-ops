'use client'

import { Building2Icon, ChevronsUpDownIcon } from 'lucide-react'

import {
	type UsageScope,
	useDashboardPeriod,
} from '@/components/dashboard/dashboard-period-context'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getInitials } from '@/lib/utils'

type ScopeOption = {
	value: UsageScope
	name: string
	description: string
	initials?: string
}

type UsageScopeSelectorProps = {
	userName: string
	companyName: string
}

function ScopeOptionContent({ option }: { option: ScopeOption }) {
	return (
		<div className="flex min-w-0 flex-1 items-center gap-2.5">
			{option.value === 'personal' ? (
				<Avatar size="sm">
					<AvatarFallback className="text-xs font-medium">
						{option.initials}
					</AvatarFallback>
				</Avatar>
			) : (
				<div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-foreground text-background">
					<Building2Icon />
				</div>
			)}
			<div className="flex min-w-0 flex-col gap-0.5 text-left">
				<span className="truncate text-sm font-medium">{option.name}</span>
				<span className="truncate text-xs text-muted-foreground">
					{option.description}
				</span>
			</div>
		</div>
	)
}

export function UsageScopeSelector({
	userName,
	companyName,
}: UsageScopeSelectorProps) {
	const { scope, setScope } = useDashboardPeriod()

	const options: ScopeOption[] = [
		{
			value: 'personal',
			name: userName,
			description: 'Personal usage',
			initials: getInitials(userName),
		},
		{
			value: 'company',
			name: companyName,
			description: 'Company-wide usage',
		},
	]

	const selected = options.find((option) => option.value === scope) ?? options[0]

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					className="h-auto gap-2.5 px-2 py-1.5 font-normal hover:bg-muted"
				>
					<ScopeOptionContent option={selected} />
					<ChevronsUpDownIcon className="shrink-0 text-muted-foreground" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-72">
				<DropdownMenuLabel>View usage for</DropdownMenuLabel>
				<DropdownMenuGroup>
					<DropdownMenuRadioGroup
						value={scope}
						onValueChange={(value) => setScope(value as UsageScope)}
					>
						{options.map((option) => (
							<DropdownMenuRadioItem
								key={option.value}
								value={option.value}
								className="py-2"
							>
								<ScopeOptionContent option={option} />
							</DropdownMenuRadioItem>
						))}
					</DropdownMenuRadioGroup>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
