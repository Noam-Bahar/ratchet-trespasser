import { useCallback, useState } from 'react';

function useBoundedCounter(min: number, max: number, initialValue?: number) {
  const [count, setCount] = useState(
    initialValue ? Math.min(max, Math.max(min, initialValue)) : min
  );

  const increment = useCallback(
    (onIncrement?: (prevCount?: number) => void) => {
      setCount((prevCount) => {
        if (typeof onIncrement === 'function') {
          onIncrement(prevCount);
        }
        return Math.min(prevCount + 1, max);
      });
    },
    [max]
  );

  const decrement = useCallback(
    (onDecrement?: (prevCount?: number) => void) => {
      setCount((prevCount) => {
        if (typeof onDecrement === 'function') {
          onDecrement(prevCount);
        }
        return Math.max(prevCount - 1, min);
      });
    },
    [min]
  );

  return { count, increment, decrement };
}

export default useBoundedCounter;
