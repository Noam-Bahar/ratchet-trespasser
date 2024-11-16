import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useBoundedCounter from '../hooks/use-bounded-counter';
import {
  Blocker,
  Laser,
  RingItemType,
} from '../lib/definitions/ring-item-type';
import useKeydown from '../hooks/use-keydown';
import useSound from 'use-sound';
import trespasserJump from '../assets/trespasser-jump.wav';
import trespasserRotate from '../assets/trespasser-rotate.wav';
import Ring from './ring';
import usePrevious from '../hooks/use-previous';

type LaserBeamEnd = {
  ringIndex: number;
  blockedOnNearSide: boolean;
};

function Puzzle({
  sides,
  rings,
  ringsData,
  receptorPositions,
}: {
  sides: number;
  rings: number;
  ringsData: Record<number, RingItemType>[];
  receptorPositions: number[];
}) {
  if (sides % 2 !== 0)
    throw new Error('Invinco-Lock must have an odd number of sides');

  //#region Ring controllers
  const {
    count: focusedRing,
    increment: jumpRingOut,
    decrement: jumpRingIn,
  } = useBoundedCounter(0, rings - 1, rings - 1);

  const [ringRotations, setRingRotations] = useState(
    Array.from({ length: rings }, () => 0)
  );

  //#endregion

  const rotateIndex = useCallback(
    (itemIndex: number, ringRotation: number) =>
      (itemIndex + ringRotation + sides) % sides,
    [sides]
  );

  const getOpposite = useCallback(
    (itemIndex: number) => rotateIndex(itemIndex, sides / 2),
    [rotateIndex, sides]
  );

  //#region Laser stop calculator

  const calculateLaserBeamStop = useCallback(
    (ringIndex: number, laserRotatedIndex: number): LaserBeamEnd => {
      let blockedOnNearSide = false;
      let blockingRingIndex = rings;

      // Iterate over all rings
      ringsData.forEach((currIterRingData, currRingIndex) => {
        if (currRingIndex === ringIndex) return; // Skip the current ring

        const currIterRingRotation = ringRotations[currRingIndex];

        // Iterate over each item in the current ring
        Object.entries(currIterRingData).forEach(([currIterItemIndex]) => {
          const currIterItemRotatedIndex = rotateIndex(
            parseInt(currIterItemIndex),
            currIterRingRotation
          );

          // Check for blockers in the same side of the circle
          if (
            currRingIndex < ringIndex && // Outer ring relative to the laser's ring
            currIterItemRotatedIndex === laserRotatedIndex
          ) {
            blockedOnNearSide = true;
            blockingRingIndex = currRingIndex;
          }

          // Check for blockers on the opposite side of the circle
          if (
            !blockedOnNearSide &&
            currRingIndex < blockingRingIndex &&
            laserRotatedIndex ===
              rotateIndex(currIterItemRotatedIndex, sides / 2)
          ) {
            blockingRingIndex = currRingIndex;
          }
        });
      });

      return {
        ringIndex: blockingRingIndex,
        blockedOnNearSide,
      };
    },
    [ringRotations, rings, ringsData, rotateIndex, sides]
  );

  //#endregion

  //#region Lasers state

  const prevRotations = usePrevious(ringRotations);
  const prevRingsWithLasers =
    useRef<
      Record<
        number,
        { type: 'laser'; laserStopsAt: LaserBeamEnd } | { type: 'blocker' }
      >[]
    >();

  const ringsWithLasers = useMemo<
    Record<
      number,
      | {
          type: 'laser';
          laserStopsAt: LaserBeamEnd;
        }
      | { type: 'blocker' }
    >[]
  >(() => {
    // Skip calculation on focused ring change
    if (
      !!prevRotations &&
      prevRotations.every((rotation, i) => rotation === ringRotations[i])
    ) {
      // Skip initialization after the first render
      if (prevRingsWithLasers.current) {
        return prevRingsWithLasers.current;
      }

      return ringsData.map((ringItems) => {
        const result: Record<
          number,
          | {
              type: Laser;
              laserStopsAt: LaserBeamEnd;
            }
          | { type: Blocker }
        > = {};

        Object.entries(ringItems).forEach(([ringItemIndex, ringItemType]) => {
          const parsedIndex = parseInt(ringItemIndex);

          if (ringItemType === 'laser') {
            result[parsedIndex] = {
              type: ringItemType,
              laserStopsAt: {
                ringIndex: rings,
                blockedOnNearSide: false,
              },
            };
          } else {
            result[parsedIndex] = { type: ringItemType };
          }
        });

        return result;
      });
    }

    const calculatedRingsWithLasers = ringsData.map((ringItems, ringIndex) => {
      const ringRotation = ringRotations[ringIndex];
      const result: Record<
        number,
        | {
            type: Laser;
            laserStopsAt: LaserBeamEnd;
          }
        | { type: Blocker }
      > = {};

      Object.entries(ringItems).forEach(([ringItemIndex, ringItemType]) => {
        const parsedIndex = parseInt(ringItemIndex);

        if (ringItemType === 'laser') {
          const rotatedIndex = rotateIndex(parsedIndex, ringRotation);

          result[parsedIndex] = {
            type: ringItemType,
            laserStopsAt: calculateLaserBeamStop(ringIndex, rotatedIndex),
          };
        } else {
          result[parsedIndex] = { type: ringItemType };
        }
      });

      return result;
    });

    prevRingsWithLasers.current = calculatedRingsWithLasers;

    return calculatedRingsWithLasers;
  }, [
    ringsData,
    ringRotations,
    rings,
    prevRotations,
    rotateIndex,
    calculateLaserBeamStop,
  ]);

  //#endregion

  //#region Receptors state

  const receptors = useMemo(() => {
    return receptorPositions.reduce<Record<number, boolean>>(
      (acc, receptorPosition) => {
        let receptopOn = false;

        const allLasers = ringsWithLasers
          .map((ringItems, ringIndex) => {
            const lasersOnly = Object.entries(ringItems).filter(
              // prettier-ignore
              (x): x is [
                string,
                {
                  type: Laser;
                  laserStopsAt: LaserBeamEnd;
                }
              ] => x[1].type === 'laser'
            );

            return lasersOnly.map<[number, LaserBeamEnd]>(
              ([itemIndex, { laserStopsAt }]) => [
                rotateIndex(parseInt(itemIndex), ringRotations[ringIndex]),
                laserStopsAt,
              ]
            );
          })
          .flat();

        allLasers.forEach(([laserBeamStart, laserBeamEnd]) => {
          if (
            laserBeamEnd.ringIndex === rings &&
            getOpposite(receptorPosition) === laserBeamStart
          ) {
            receptopOn = true;
          }
        });

        acc[receptorPosition] = receptopOn;
        return acc;
      },
      {}
    );
  }, [
    receptorPositions,
    ringsWithLasers,
    rings,
    ringRotations,
    rotateIndex,
    getOpposite,
  ]);

  //#endregion

  const isWinner = useMemo(
    () => Object.entries(receptors).every(([, receptor]) => receptor),
    [receptors]
  );

  //#region User inputs

  const [playRotateRing] = useSound(trespasserRotate, { playbackRate: 0.75 });
  const [playJumpRing] = useSound(trespasserJump);

  const rotateFocusedRing = useCallback(
    (direction: 'left' | 'right') => {
      setRingRotations((prev) =>
        prev.map((prevRingRotation, ringIndex) => {
          if (ringIndex === focusedRing) {
            const rotateBy = { left: -1, right: 1 };
            return prevRingRotation + rotateBy[direction];
          }
          return prevRingRotation;
        })
      );

      playRotateRing();
    },
    [focusedRing, playRotateRing]
  );

  const handleJumpIn = useCallback(() => {
    if (focusedRing !== 0) playJumpRing();
    jumpRingIn();
  }, [focusedRing, playJumpRing, jumpRingIn]);

  const handleJumpOut = useCallback(() => {
    if (focusedRing !== rings - 1) playJumpRing();
    jumpRingOut();
  }, [focusedRing, playJumpRing, jumpRingOut, rings]);

  function rotateLeft() {
    rotateFocusedRing('left');
  }

  function rotateRight() {
    rotateFocusedRing('right');
  }

  function winnerify(fn: () => void) {
    if (!isWinner) fn();
  }

  useKeydown(true, {
    ArrowUp: () => winnerify(handleJumpIn),
    ArrowDown: () => winnerify(handleJumpOut),
    ArrowLeft: () => winnerify(rotateLeft),
    ArrowRight: () => winnerify(rotateRight),
  });

  //#endregion

  const angleStep = 360 / sides;

  //#region Graphics

  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    console.log(dialogRef?.current);

    if (!!dialogRef?.current && isWinner) {
      dialogRef.current.showModal();
    }
  }, [isWinner]);

  return (
    <>
      <dialog ref={dialogRef}>
        {isWinner && <h1>I AM THE WINNER!!</h1>}
        <button onClick={() => location.reload()}>Try again</button>
      </dialog>
      <div
        style={{
          display: 'grid',
          placeItems: 'center',
          width: '100vw',
          height: '100vh',
        }}
      >
        <div
          style={{
            width: 500,
            aspectRatio: 1,
            position: 'relative',
          }}
        >
          {ringsWithLasers.map((ring, index) => (
            <Ring
              key={index}
              ringItems={ring}
              ringFocused={index === focusedRing}
              ringIndex={index}
              rotation={ringRotations[index]}
            />
          ))}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              translate: '-50% -50%',
              width: 500,
              aspectRatio: 1,
            }}
          >
            {Array.from({ length: sides }).map((_, index) => {
              const isReceptor = index in receptors;
              const currentReceptor = receptors[index];
              return (
                <div
                  key={index}
                  className={
                    isReceptor
                      ? currentReceptor
                        ? 'receptor-lit'
                        : 'receptor-unlit'
                      : 'receptor-none'
                  }
                  style={{
                    width: 10,
                    height: 100,
                    position: 'absolute',
                    top: '50%',
                    right: 'calc(100% + 20px)',
                    translate: '100% -50%',
                    rotate: `${index * angleStep}deg`,
                    transformOrigin: 270,
                  }}
                />
              );
            })}
          </div>
        </div>
        <div className='dpad'>
          <button className='dpad-button up' onClick={() => handleJumpIn()} />
          <div className='dpad-middle'>
            <button className='dpad-button left' onClick={() => rotateLeft()} />
            <button
              className='dpad-button right'
              onClick={() => rotateRight()}
            />
          </div>
          <button
            className='dpad-button down'
            onClick={() => handleJumpOut()}
          />
        </div>
      </div>
    </>
  );
}

export default Puzzle;
