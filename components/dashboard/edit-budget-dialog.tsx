'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CircleAlertIcon, PencilIcon } from 'lucide-react'

import { formatCurrency } from '@/components/data-cards/usage-metrics'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from '@/components/ui/field'
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	InputGroupText,
} from '@/components/ui/input-group'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useTRPC } from '@/trpc/client'

import type { UsageScope } from './dashboard-period-context'

const BUDGET_PRESETS = [300, 600, 1000, 1500]

const COPY: Record<UsageScope, { title: string; description: string }> = {
	personal: {
		title: 'Set my monthly budget',
		description: 'The monthly cap for your own AI usage.',
	},
	company: {
		title: 'Set company budget',
		description: 'The monthly cap for company-wide AI usage.',
	},
}

type BudgetFormProps = {
	formId: string
	amount: string
	onAmountChange: (value: string) => void
	spent: number
	onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
}

function BudgetForm({
	formId,
	amount,
	onAmountChange,
	spent,
	onSubmit,
}: BudgetFormProps) {
	return (
		<form id={formId} onSubmit={onSubmit}>
			<FieldGroup>
				<Field>
					<FieldLabel
						htmlFor={`${formId}-amount`}
						className="sr-only"
					>
						Monthly budget
					</FieldLabel>
					<InputGroup>
						<InputGroupAddon>
							<InputGroupText>$</InputGroupText>
						</InputGroupAddon>
						<InputGroupInput
							id={`${formId}-amount`}
							type="number"
							inputMode="decimal"
							min={0}
							step={1}
							value={amount}
							onChange={(e) => onAmountChange(e.target.value)}
							className="text-lg font-semibold"
							required
						/>
						<InputGroupAddon align="inline-end">
							<InputGroupText>/ month</InputGroupText>
						</InputGroupAddon>
					</InputGroup>
				</Field>

				<ToggleGroup
					type="single"
					variant="outline"
					value={
						BUDGET_PRESETS.includes(Number(amount)) ? amount : ''
					}
					onValueChange={(value) => {
						if (value) onAmountChange(value)
					}}
					className="w-full"
				>
					{BUDGET_PRESETS.map((preset) => (
						<ToggleGroupItem
							key={preset}
							value={String(preset)}
							className="flex-1"
						>
							{formatCurrency(preset, 0)}
						</ToggleGroupItem>
					))}
				</ToggleGroup>

				<FieldDescription>
					You&apos;ve spent {formatCurrency(spent)} so far this month.
				</FieldDescription>
			</FieldGroup>
		</form>
	)
}

type EditBudgetDialogProps = {
	defaultBudgetType: UsageScope
}

export function EditBudgetDialog({ defaultBudgetType }: EditBudgetDialogProps) {
	const trpc = useTRPC()
	const queryClient = useQueryClient()

	const [open, setOpen] = useState(false)
	const [activeTab, setActiveTab] = useState<UsageScope>(defaultBudgetType)
	const [personalAmount, setPersonalAmount] = useState('')
	const [companyAmount, setCompanyAmount] = useState('')

	const { data: companyData } = useQuery(
		trpc.company.getCompany.queryOptions(),
	)
	const isAdmin = companyData?.role === 'owner'

	const { data: memberBudget } = useQuery(
		trpc.company.getMemberBudget.queryOptions(),
	)
	const { data: companyBudget } = useQuery({
		...trpc.company.getCompanyBudget.queryOptions(),
		enabled: isAdmin,
	})
	const { data: personalUsage } = useQuery(
		trpc.usage.getCurrentMonthUsage.queryOptions({ scope: 'personal' }),
	)
	const { data: companyUsage } = useQuery({
		...trpc.usage.getCurrentMonthUsage.queryOptions({ scope: 'company' }),
		enabled: isAdmin,
	})

	const setMemberBudget = useMutation(
		trpc.company.setMemberBudget.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.company.getMemberBudget.queryKey(),
				})
				setOpen(false)
			},
		}),
	)

	const setCompanyBudget = useMutation(
		trpc.company.setCompanyBudget.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.company.getCompanyBudget.queryKey(),
				})
				setOpen(false)
			},
		}),
	)

	const handleOpenChange = (nextOpen: boolean) => {
		setOpen(nextOpen)
		if (nextOpen) {
			setActiveTab(defaultBudgetType)
			setPersonalAmount(
				memberBudget?.budget != null ? String(memberBudget.budget) : '',
			)
			setCompanyAmount(
				companyBudget?.budget != null
					? String(companyBudget.budget)
					: '',
			)
		} else {
			setMemberBudget.reset()
			setCompanyBudget.reset()
		}
	}

	const handlePersonalSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		setMemberBudget.mutate({ budget: Math.round(Number(personalAmount)) })
	}

	const handleCompanySubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		setCompanyBudget.mutate({ budget: Math.round(Number(companyAmount)) })
	}

	const isSaving = setMemberBudget.isPending || setCompanyBudget.isPending
	const activeFormId =
		activeTab === 'personal'
			? 'personal-budget-form'
			: 'company-budget-form'
	const activeError =
		activeTab === 'personal'
			? setMemberBudget.error
			: setCompanyBudget.error
	const copy = COPY[activeTab]

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm">
					<PencilIcon data-icon="inline-start" />
					Edit budget
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>{copy.title}</DialogTitle>
					<DialogDescription>{copy.description}</DialogDescription>
				</DialogHeader>

				{activeError && (
					<Alert variant="destructive">
						<CircleAlertIcon />
						<AlertTitle>Couldn&apos;t save budget</AlertTitle>
						<AlertDescription>
							{activeError.message}
						</AlertDescription>
					</Alert>
				)}

				{isAdmin ? (
					<Tabs
						value={activeTab}
						onValueChange={(value) =>
							setActiveTab(value as UsageScope)
						}
					>
						<TabsList className="w-full">
							<TabsTrigger value="personal" className="flex-1">
								My budget
							</TabsTrigger>
							<TabsTrigger value="company" className="flex-1">
								Company budget
							</TabsTrigger>
						</TabsList>
						<TabsContent value="personal">
							<BudgetForm
								formId="personal-budget-form"
								amount={personalAmount}
								onAmountChange={setPersonalAmount}
								spent={Number(personalUsage?.totalCostUsd ?? 0)}
								onSubmit={handlePersonalSubmit}
							/>
						</TabsContent>
						<TabsContent value="company">
							<BudgetForm
								formId="company-budget-form"
								amount={companyAmount}
								onAmountChange={setCompanyAmount}
								spent={Number(companyUsage?.totalCostUsd ?? 0)}
								onSubmit={handleCompanySubmit}
							/>
						</TabsContent>
					</Tabs>
				) : (
					<BudgetForm
						formId="personal-budget-form"
						amount={personalAmount}
						onAmountChange={setPersonalAmount}
						spent={Number(personalUsage?.totalCostUsd ?? 0)}
						onSubmit={handlePersonalSubmit}
					/>
				)}

				<DialogFooter>
					<DialogClose asChild>
						<Button type="button" variant="outline">
							Cancel
						</Button>
					</DialogClose>
					<Button
						type="submit"
						form={activeFormId}
						disabled={isSaving}
					>
						Save budget
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
