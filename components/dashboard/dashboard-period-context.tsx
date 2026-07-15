'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

export const DASHBOARD_PERIODS = [7, 30] as const

export type DashboardPeriod = (typeof DASHBOARD_PERIODS)[number]

export type UsageScope = 'personal' | 'company'

type DashboardPeriodContextValue = {
	period: DashboardPeriod
	setPeriod: (period: DashboardPeriod) => void
	scope: UsageScope
	setScope: (scope: UsageScope) => void
}

const DashboardPeriodContext =
	createContext<DashboardPeriodContextValue | null>(null)

export function DashboardPeriodProvider({
	children,
	defaultPeriod = 30,
	defaultScope = 'personal',
}: {
	children: ReactNode
	defaultPeriod?: DashboardPeriod
	defaultScope?: UsageScope
}) {
	const [period, setPeriod] = useState<DashboardPeriod>(defaultPeriod)
	const [scope, setScope] = useState<UsageScope>(defaultScope)

	return (
		<DashboardPeriodContext.Provider
			value={{ period, setPeriod, scope, setScope }}
		>
			{children}
		</DashboardPeriodContext.Provider>
	)
}
export function useDashboardPeriod() {
	const ctx = useContext(DashboardPeriodContext)

	if (!ctx)
		throw new Error(
			'useDashboardPeriod must be used within DashboardPeriodProvider',
		)

	return ctx
}
