import {
	Baby,
	Banknote,
	Bike,
	BookOpen,
	Briefcase,
	Building2,
	Camera,
	Car,
	Coins,
	Dog,
	Dumbbell,
	Gem,
	Gift,
	Gamepad2,
	GraduationCap,
	HeartPulse,
	Home,
	House,
	Landmark,
	Laptop,
	PiggyBank,
	Plane,
	Rocket,
	ShieldCheck,
	Smartphone,
	Sofa,
	Sprout,
	Stethoscope,
	Target,
	Umbrella,
	Wallet,
	Wrench
} from '@lucide/svelte';
import type { LucideIcon } from '@lucide/svelte';

/**
 * Curated palette for savings lines. Keys are the Lucide export names that get
 * persisted on `SavingsLine.icon`, so they must stay stable.
 */
export const SAVINGS_ICONS: Record<string, LucideIcon> = {
	PiggyBank,
	Wallet,
	Banknote,
	Coins,
	Landmark,
	Gem,
	Car,
	Bike,
	House,
	Home,
	Building2,
	Sofa,
	Smartphone,
	Laptop,
	Plane,
	Gift,
	GraduationCap,
	BookOpen,
	Stethoscope,
	HeartPulse,
	ShieldCheck,
	Umbrella,
	Briefcase,
	Wrench,
	Rocket,
	Sprout,
	Camera,
	Dumbbell,
	Gamepad2,
	Baby,
	Dog,
	Target
};

/** Resolve an icon name, falling back to the piggy bank. */
export function savingsIcon(name: string | undefined | null): LucideIcon {
	if (name && SAVINGS_ICONS[name]) return SAVINGS_ICONS[name];
	return PiggyBank;
}

/** Ordered icon names for the picker. */
export const SAVINGS_ICON_NAMES = Object.keys(SAVINGS_ICONS);
