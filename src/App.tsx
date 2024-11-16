import type { RingItemType } from './lib/definitions/ring-item-type';
import Puzzle from './components/invinco-lock';

const receptors = [2, 4, 6, 9];

const ringsData: Record<number, RingItemType>[] = [
  {
    3: 'blocker',
    6: 'laser',
    10: 'laser',
    11: 'laser',
  },
  {
    1: 'laser',
    3: 'laser',
    8: 'laser',
  },
  {
    1: 'blocker',
    3: 'blocker',
    4: 'laser',
  },
];

function App() {
  return (
    <Puzzle
      receptorPositions={receptors}
      ringsData={ringsData}
      rings={3}
      sides={12}
    />
  );
}

export default App;
