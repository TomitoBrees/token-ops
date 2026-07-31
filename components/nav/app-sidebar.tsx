'use client'

import * as React from 'react'
import {
	BookOpen,
	CircleGaugeIcon,
	LifeBuoyIcon,
	SettingsIcon,
	SquareChartGanttIcon,
} from 'lucide-react'

import { ConnectIdeGuide } from '@/components/connect-ide/connect-ide-guide'
import { NavMain } from '@/components/nav/nav-main'
import { NavSecondary } from '@/components/nav/nav-secondary'
import { NavUser } from '@/components/nav/nav-user'
import { TokenitoIcon } from '@/components/tokenito-icon'
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar'

const data = {
	user: {
		name: 'shadcn',
		email: 'm@example.com',
		avatar: '/avatars/shadcn.jpg',
	},
	navMain: [
		{
			title: 'Dashboard',
			url: '/dashboard',
			icon: CircleGaugeIcon,
		},
		{
			title: 'Projects',
			url: '#',
			icon: SquareChartGanttIcon,
		},
	],
	navSecondary: [
		{
			title: 'Settings',
			url: '#',
			icon: SettingsIcon,
		},
		{
			title: 'Get Help',
			url: '#',
			icon: LifeBuoyIcon,
		},
	],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar collapsible="offcanvas" {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton asChild size="lg">
							<a href="#" className="flex items-center gap-2">
								<TokenitoIcon
									className="size-8! shrink-0"
									aria-hidden="true"
								/>
								<span className="font-brand text-base font-semibold">
									Tokenito
								</span>
							</a>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={data.navMain} />
				<NavSecondary items={data.navSecondary} className="mt-auto">
					<SidebarMenuItem>
						<ConnectIdeGuide>
							<SidebarMenuButton>
								<BookOpen />
								<span>Connect your IDE</span>
							</SidebarMenuButton>
						</ConnectIdeGuide>
					</SidebarMenuItem>
				</NavSecondary>
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={data.user} />
			</SidebarFooter>
		</Sidebar>
	)
}
