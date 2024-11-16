import { useCallback, useMemo, useState } from 'react';

function useCircularCounter(cycleSize: number, initialValue?: number) {
  const [count, setCount] = useState(initialValue ?? 0);

  const increment = useCallback(() => {
    setCount((prevCount) => (prevCount + 1) % cycleSize);
  }, [cycleSize]);

  const decrement = useCallback(() => {
    setCount((prevCount) => (prevCount - 1 + cycleSize) % cycleSize);
  }, [cycleSize]);

  const getOffsetValue = useCallback(
    (offset: number) => (count + offset + cycleSize) % cycleSize,
    [cycleSize, count]
  );

  const oppositeValue = useMemo(
    () => getOffsetValue(cycleSize / 2),
    [cycleSize, getOffsetValue]
  );

  return [
    count,
    { increment, decrement, getOffsetValue, oppositeValue },
  ] as const;
}

export default useCircularCounter;
