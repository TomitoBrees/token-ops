'use client'

import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { InviteMemberDialog } from '@/components/invite-member/invite-member-dialog'
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar'

function isNavItemActive(pathname: string, url: string) {
	if (url === '#') {
		return false
	}

	return pathname === url || pathname.startsWith(`${url}/`)
}

export function NavMain({
	items,
}: {
	items: {
		title: string
		url: string
		icon: LucideIcon
	}[]
}) {
	const pathname = usePathname()

	return (
		<SidebarGroup>
			<SidebarGroupContent className="flex flex-col gap-2">
				<SidebarMenu>
					<InviteMemberDialog />
				</SidebarMenu>
				<SidebarMenu>
					{items.map((item) => {
						const isActive = isNavItemActive(pathname, item.url)

						return (
							<SidebarMenuItem key={item.title}>
								<SidebarMenuButton
									asChild
									tooltip={item.title}
									isActive={isActive}
								>
									<Link href={item.url}>
										<item.icon />
										<span>{item.title}</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						)
					})}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	)
}
