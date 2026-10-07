import { createContext, useCallback, useContext, useState } from 'react';
import ActivitySheet from './ActivitySheet';
import GoalSheet from './GoalSheet';
import MeasurementSheet from './MeasurementSheet';
import WeightSheet from './WeightSheet';
import WorkoutSheet from './WorkoutSheet';

// Quick-action sheets can be opened from any screen: openSheet('weight'), openSheet('workout', { workout }).
// Only one sheet exists at a time; a new `key` per open gives every sheet a fresh form.
const SHEETS = { weight: WeightSheet, workout: WorkoutSheet, measurement: MeasurementSheet, activity: ActivitySheet, goal: GoalSheet };

const SheetContext = createContext(() => {});

export function SheetProvider({ children }) {
  const [sheet, setSheet] = useState({ name: null, params: {}, visible: false, key: 0 });

  const open = useCallback((name, params = {}) => {
    setSheet((previous) => ({ name, params, visible: true, key: previous.key + 1 }));
  }, []);
  const close = useCallback(() => setSheet((previous) => ({ ...previous, visible: false })), []);

  const Current = sheet.name ? SHEETS[sheet.name] : null;

  return (
    <SheetContext.Provider value={open}>
      {children}
      {Current ? <Current key={sheet.key} visible={sheet.visible} params={sheet.params} onClose={close} /> : null}
    </SheetContext.Provider>
  );
}

export function useSheet() {
  return useContext(SheetContext);
}
