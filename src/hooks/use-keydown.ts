import { useEffect } from 'react';

function useKeydown(enabled: boolean, callbackMap: Record<string, () => void>) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key in callbackMap) {
        callbackMap[event.key]();
      }
    }

    if (enabled) window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, callbackMap]);
}

export default useKeydown;
