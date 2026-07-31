export function TokenitoIcon(props: React.ComponentProps<'svg'>) {
	return (
		<svg
			viewBox="0 0 120 120"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<title>Tokenito icon</title>
			<g transform="rotate(-20 60 60)">
				<path
					d="M16 60 A44 15 0 0 1 104 60"
					fill="none"
					stroke="#8fc3ad"
					strokeWidth="4.5"
					strokeLinecap="round"
				/>
			</g>
			<circle cx="60" cy="56" r="23" fill="#1a8a66" />
			<ellipse
				cx="52"
				cy="48"
				rx="9"
				ry="6"
				fill="#ffffff"
				opacity="0.16"
			/>
			<path
				d="M60 56 m -23 0 a 23 23 0 0 0 46 0"
				fill="#000000"
				opacity="0.09"
			/>
			<g transform="rotate(-20 60 60)">
				<path
					d="M16 60 A44 15 0 0 0 104 60"
					fill="none"
					stroke="#8fc3ad"
					strokeWidth="4.5"
					strokeLinecap="round"
				/>
				<circle cx="98" cy="67.5" r="5.5" fill="#1a8a66" />
			</g>
		</svg>
	)
}
