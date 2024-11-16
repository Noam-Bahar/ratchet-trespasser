const POSITION_INDICES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;

type PositionIndex = (typeof POSITION_INDICES)[number];

export { POSITION_INDICES, type PositionIndex };
