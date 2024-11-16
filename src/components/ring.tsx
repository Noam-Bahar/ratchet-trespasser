import { useMemo, useRef } from 'react';
import { Blocker, Laser } from '../lib/definitions/ring-item-type';

const baseRingSize = 100;
const itemSize = 40;
const angleStep = 360 / 12;

function Ring({
  ringItems,
  ringFocused,
  ringIndex,
  rotation,
}: {
  ringItems: Record<
    number,
    | {
        type: Laser;
        laserStopsAt: {
          ringIndex: number;
          blockedOnNearSide: boolean;
        };
      }
    | { type: Blocker }
  >;
  ringFocused: boolean;
  ringIndex: number;
  rotation: number;
}) {
  const ringSize = useMemo(
    () => baseRingSize * (ringIndex + 1) + baseRingSize,
    [ringIndex]
  );

  const ringRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ringRef}
      style={{
        width: ringSize,
        aspectRatio: 1,
        borderRadius: '50%',
        border: `2px solid ${ringFocused ? 'gold' : 'gray'}`,
        position: 'absolute',
        top: '50%',
        left: '50%',
        transition: 'all 100ms',
        translate: '-50% -50%',
        rotate: `${rotation * angleStep}deg`,
      }}
    >
      {Array.from({ length: 12 }).map((_, index) => {
        if (!(index in ringItems)) return null;

        const { type: currentRingItemType } = ringItems[index];

        return (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              right: 'calc(100% + 20px)',
              translate: '100% -50%',
              rotate: `${index * angleStep}deg`,
              transformOrigin: ringSize / 2 + 20,
            }}
            key={index}
          >
            <div
              style={{
                background:
                  currentRingItemType === 'laser'
                    ? ringItems[index].laserStopsAt.ringIndex === 3
                      ? 'green'
                      : 'red'
                    : 'gray',
                width: itemSize,
                aspectRatio: 1,
                borderRadius: '50%',
                zIndex: 2,
              }}
            />
            {currentRingItemType === 'laser' && (
              <LaserBeam
                ringIndex={ringIndex}
                stopAt={ringItems[index].laserStopsAt}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function LaserBeam({
  ringIndex,
  stopAt,
}: {
  ringIndex: number;
  stopAt: {
    ringIndex: number;
    blockedOnNearSide: boolean;
  };
}) {
  const isBlocked = stopAt.ringIndex !== 3;

  const x = stopAt.blockedOnNearSide
    ? 300 + stopAt.ringIndex * 50
    : (2 - stopAt.ringIndex) * 50;
  const stoppingPoint = isBlocked ? 80 + x : 0;

  // near 1: 430  = (390    + 40)  = (350 + 80)
  // near 0: 380  = (340    + 40)  = (300 + 80)
  // far  0: 180  = (140    + 40)  = (100 + 80)
  // far  1: 130  = (90   + 40)    = (50 + 80)
  // far  2: 80   = (40   + 40)    = (0 + 80)

  return (
    <div
      style={{
        background: 'gold',
        opacity: 0.2,
        width: 440 - stoppingPoint - (2 - ringIndex) * 50,
        height: 10,
        position: 'absolute',
        top: '50%',
        left: itemSize,
        translate: '0 -50%',
        zIndex: 1,
      }}
    />
  );
}

export default Ring;
