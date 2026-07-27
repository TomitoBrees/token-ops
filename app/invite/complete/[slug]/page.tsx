import { CompleteInviteForm } from '@/components/invite-member/complete-invite-form'

export default async function Page({
	params,
}: {
	params: Promise<{ slug: string }>
}) {
	const { slug } = await params

	return (
		<div className="flex min-h-svh flex-col items-center justify-center bg-background p-6 md:p-10">
			<CompleteInviteForm invitationId={slug} />
		</div>
	)
}
