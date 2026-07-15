'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

export const DASHBOARD_PERIODS = [7, 30] as const

export type DashboardPeriod = (typeof DASHBOARD_PERIODS)[number]

type DashboardPeriodContextValue = {
	period: DashboardPeriod
	setPeriod: (period: DashboardPeriod) => void
}

const DashboardPeriodContext =
	createContext<DashboardPeriodContextValue | null>(null)

export function DashboardPeriodProvider({
	children,
	defaultPeriod = 30,
}: {
	children: ReactNode
	defaultPeriod?: DashboardPeriod
}) {
	const [period, setPeriod] = useState<DashboardPeriod>(defaultPeriod)

	return (
		<DashboardPeriodContext.Provider value={{ period, setPeriod }}>
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
