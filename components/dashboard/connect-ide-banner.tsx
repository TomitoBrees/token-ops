import { BookIcon } from 'lucide-react'

import { ConnectIdeGuide } from '@/components/connect-ide/connect-ide-guide'
import { Button } from '@/components/ui/button'
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemMedia,
	ItemTitle,
} from '@/components/ui/item'

export function ConnectIdeBanner() {
	return (
		<Item
			variant="outline"
			className="w-full border-warning/20 bg-warning/10"
		>
			<ItemMedia variant="icon" className="text-warning">
				<BookIcon />
			</ItemMedia>
			<ItemContent>
				<ItemTitle>Connect your IDE to start tracking usage</ItemTitle>
				<ItemDescription>
					No usage yet. Point your Claude Code agent at the proxy to
					see your calls, tokens and cost here.
				</ItemDescription>
			</ItemContent>
			<ItemActions>
				<ConnectIdeGuide>
					<Button size="sm" variant="outline">
						Open setup guide
					</Button>
				</ConnectIdeGuide>
			</ItemActions>
		</Item>
	)
}
