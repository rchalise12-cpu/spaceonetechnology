import type { Action } from 'svelte/action';
export const focusDialog: Action<HTMLElement, () => void> = (node, close) => {
	const previous = document.activeElement as HTMLElement | null;
	const oldOverflow = document.body.style.overflow;
	document.body.style.overflow = 'hidden';
	const focusable = () =>
		Array.from(
			node.querySelectorAll<HTMLElement>(
				'button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]'
			)
		);
	focusable()[0]?.focus();
	const key = (event: KeyboardEvent) => {
		if (event.key === 'Escape') {
			event.preventDefault();
			close();
		}
		if (event.key === 'Tab') {
			const elements = focusable();
			const first = elements[0];
			const last = elements.at(-1);
			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last?.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first?.focus();
			}
		}
	};
	node.addEventListener('keydown', key);
	return {
		destroy() {
			node.removeEventListener('keydown', key);
			document.body.style.overflow = oldOverflow;
			previous?.focus();
		}
	};
};
