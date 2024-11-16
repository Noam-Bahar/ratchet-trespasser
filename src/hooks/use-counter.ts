import { useCallback, useMemo, useState } from 'react';

function useCounter(initialValue?: number, step?: number) {
  const [count, setCount] = useState(initialValue ?? 0);

  const step_ = useMemo(() => step ?? 1, [step]);

  const increment = useCallback(
    (onIncrement?: (prevCount?: number) => void) => {
      setCount((prevCount) => {
        if (typeof onIncrement === 'function') {
          onIncrement(prevCount);
        }
        return prevCount + step_;
      });
    },
    [step_]
  );

  const decrement = useCallback(
    (onDecrement?: (prevCount?: number) => void) => {
      setCount((prevCount) => {
        if (typeof onDecrement === 'function') {
          onDecrement(prevCount);
        }
        return prevCount - step_;
      });
    },
    [step_]
  );

  return [count, { increment, decrement, setCount }] as const;
}

export default useCounter;
