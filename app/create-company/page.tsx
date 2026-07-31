import { RegisterCompanyForm } from '@/components/forms/register-company-form'
import { TokenitoIcon } from '@/components/tokenito-icon'

export default async function Page() {
	return (
		<div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
			<div className="flex w-full max-w-sm flex-col gap-6">
				<a
					href="#"
					className="flex items-center gap-2 self-center font-medium"
				>
					<TokenitoIcon className="size-6" aria-hidden="true" />
					<span className="font-brand">Tokenito</span>
				</a>
				<RegisterCompanyForm />
			</div>
		</div>
	)
}
