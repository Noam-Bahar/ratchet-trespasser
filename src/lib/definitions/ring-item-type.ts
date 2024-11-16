const LASER = 'laser';
const BLOCKER = 'blocker';

const RING_ITEM_TYPES = [LASER, BLOCKER] as const;

type RingItemType = (typeof RING_ITEM_TYPES)[number];

type Laser = typeof LASER;
type Blocker = typeof BLOCKER;

export { LASER, BLOCKER, RING_ITEM_TYPES };
export type { Laser, Blocker, RingItemType };
