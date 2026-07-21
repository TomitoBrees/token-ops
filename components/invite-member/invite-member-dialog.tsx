'use client'

import { useMutation } from '@tanstack/react-query'
import { MailCheckIcon } from 'lucide-react'
import { useState, type SubmitEvent } from 'react'

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
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useTRPC } from '@/trpc/client'

type InviteRole = 'developer' | 'owner'

export function InviteMemberDialog() {
	const trpc = useTRPC()
	const [email, setEmail] = useState('')
	const [role, setRole] = useState<InviteRole>('developer')

	const inviteMember = useMutation(
		trpc.invitation.inviteMember.mutationOptions({
			onSuccess: () => {
				console.log('Invitation Sent')
				setEmail('')
				setRole('developer')
			},
			onError: (err) => {
				console.log(err.message)
			},
		}),
	)

	const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
		e.preventDefault()
		inviteMember.mutate({ email, role })
	}

	return (
		<Dialog>
			<SidebarMenuItem className="flex items-center gap-2">
				<DialogTrigger asChild>
					<SidebarMenuButton
						tooltip="Quick Create"
						className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
					>
						<MailCheckIcon />
						<span>Invite Members</span>
					</SidebarMenuButton>
				</DialogTrigger>
			</SidebarMenuItem>

			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>Invite member</DialogTitle>
					<DialogDescription>
						Send an invitation email to join your company.
					</DialogDescription>
				</DialogHeader>

				<form id="invite-member-form" onSubmit={handleSubmit}>
					<FieldGroup>
						<Field>
							<FieldLabel htmlFor="invite-email">
								Email
							</FieldLabel>
							<Input
								id="invite-email"
								type="email"
								name="email"
								placeholder="name@company.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
							/>
						</Field>

						<Field>
							<FieldLabel id="invite-role-label">Role</FieldLabel>
							<ToggleGroup
								type="single"
								variant="outline"
								value={role}
								onValueChange={(value) => {
									if (
										value === 'developer' ||
										value === 'owner'
									) {
										setRole(value)
									}
								}}
								aria-labelledby="invite-role-label"
								className="w-full"
							>
								<ToggleGroupItem
									value="developer"
									aria-label="Member"
									className="flex-1"
								>
									Member
								</ToggleGroupItem>
								<ToggleGroupItem
									value="owner"
									aria-label="Admin"
									className="flex-1"
								>
									Admin
								</ToggleGroupItem>
							</ToggleGroup>
						</Field>
					</FieldGroup>
				</form>

				<DialogFooter>
					<DialogClose asChild>
						<Button type="button" variant="outline">
							Cancel
						</Button>
					</DialogClose>
					<Button
						type="submit"
						form="invite-member-form"
						disabled={inviteMember.isPending}
					>
						Send invite
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
