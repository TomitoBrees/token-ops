'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { GalleryVerticalEndIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, type SubmitEvent } from 'react'

import { Button } from '@/components/ui/button'
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useTRPC } from '@/trpc/client'

type CompleteInviteFormProps = {
	invitationId: string
}

export function CompleteInviteForm({ invitationId }: CompleteInviteFormProps) {
	const trpc = useTRPC()
	const router = useRouter()
	const [displayName, setDisplayName] = useState('')
	const [error, setError] = useState<string | null>(null)

	const {
		data: invitation,
		isLoading: invitationLoading,
		isError: invitationError,
		error: invitationQueryError,
	} = useQuery(trpc.invitation.getInvitationFromId.queryOptions(invitationId))

	const {
		data: profile,
		isLoading: profileLoading,
		isError: profileError,
	} = useQuery(trpc.profile.getProfile.queryOptions())

	const acceptInvitation = useMutation(
		trpc.invitation.acceptInvitation.mutationOptions({
			onSuccess: () => {
				router.push('/dashboard')
				router.refresh()
			},
			onError: (err) => {
				setError(err.message)
			},
		}),
	)

	const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
		e.preventDefault()
		setError(null)
		acceptInvitation.mutate({ invitationId, displayName })
	}

	if (invitationLoading || profileLoading) {
		return (
			<div className="flex w-full max-w-sm flex-col gap-6">
				<div className="flex flex-col items-center gap-2 text-center">
					<Skeleton className="h-8 w-56" />
					<Skeleton className="h-4 w-48" />
				</div>
				<div className="flex flex-col gap-5">
					<div className="flex flex-col gap-2">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-9 w-full" />
						<Skeleton className="h-4 w-64" />
					</div>
					<Skeleton className="h-9 w-full" />
				</div>
			</div>
		)
	}

	if (invitationError || profileError || !invitation || !profile) {
		return (
			<div className="flex w-full max-w-sm flex-col gap-2 text-center">
				<h1 className="text-2xl font-semibold tracking-tight">
					Invitation unavailable
				</h1>
				<p className="text-sm text-muted-foreground">
					{invitationQueryError?.message ??
						'This invitation could not be loaded.'}
				</p>
			</div>
		)
	}

	if (invitation.status !== 'pending') {
		return (
			<div className="flex w-full max-w-sm flex-col gap-2 text-center">
				<h1 className="text-2xl font-semibold tracking-tight">
					Invitation unavailable
				</h1>
				<p className="text-sm text-muted-foreground">
					This invitation is no longer pending.
				</p>
			</div>
		)
	}

	const companyName = invitation.company?.name ?? 'workspace'
	const email = profile.email ?? invitation.email

	return (
		<div className="flex w-full max-w-sm flex-col gap-6">
			<div className="flex flex-col items-center gap-1.5 text-center">
				<div className="mb-3 flex size-8 items-center justify-center rounded-md text-primary">
					<GalleryVerticalEndIcon className="size-6" />
				</div>
				<h1 className="text-2xl font-semibold tracking-tight">
					Join {companyName}
				</h1>
				<p className="text-sm text-muted-foreground">
					Signing in as {email}
				</p>
			</div>

			<form onSubmit={handleSubmit}>
				<FieldGroup>
					<Field data-invalid={!!error || undefined}>
						<FieldLabel htmlFor="display-name">
							Display name
						</FieldLabel>
						<Input
							id="display-name"
							name="displayName"
							type="text"
							placeholder="How your name appears to teammates"
							value={displayName}
							onChange={(e) => setDisplayName(e.target.value)}
							aria-invalid={!!error || undefined}
							required
							autoFocus
						/>
						<FieldDescription>
							This is how you&apos;ll show up in usage reports.
						</FieldDescription>
						{error && <FieldError>{error}</FieldError>}
					</Field>

					<Field>
						<Button
							type="submit"
							className="w-full"
							size="lg"
							disabled={acceptInvitation.isPending}
						>
							{acceptInvitation.isPending
								? 'Joining...'
								: 'Join workspace'}
						</Button>
					</Field>
				</FieldGroup>
			</form>
		</div>
	)
}
