import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { calculateBMI, createId, latestWeight, todayISO } from './fitness';
import { clearData, createEmptyData, loadData, saveData } from './storage';

// App-wide state: one persisted data object (see storage.js) managed by a reducer.
// Calculations live in fitness.js; this file only stores and updates records.

const AthletiqContext = createContext(null);

// Keeps profile.weightKg equal to the newest weigh-in, so "current weight" has one meaning everywhere.
function syncProfileWeight(state) {
  const latest = latestWeight(state.weightHistory);
  if (!state.profile || !latest) return state;
  return { ...state, profile: { ...state.profile, weightKg: latest.weightKg } };
}

function weightEntry({ weightKg, date, note }, heightCm) {
  return {
    id: createId(),
    date,
    createdAt: Date.now(),
    weightKg,
    heightCm, // height used for this BMI, so later height edits never rewrite history
    bmi: Math.round(calculateBMI(weightKg, heightCm) * 10) / 10,
    note: note || '',
  };
}

function reducer(state, action) {
  switch (action.type) {
    case 'loaded':
      return action.data;

    case 'reset':
      return createEmptyData();

    case 'setUnits':
      return { ...state, settings: { ...state.settings, unitSystem: action.unitSystem } };

    case 'saveProfile': {
      const previousWeight = latestWeight(state.weightHistory)?.weightKg;
      const next = { ...state, profile: action.profile };
      // A changed weight in the profile is recorded as today's weigh-in.
      if (previousWeight == null || Math.abs(previousWeight - action.profile.weightKg) >= 0.05) {
        next.weightHistory = [
          ...state.weightHistory,
          weightEntry({ weightKg: action.profile.weightKg, date: todayISO(), note: 'Profile update' }, action.profile.heightCm),
        ];
      }
      return syncProfileWeight(next);
    }

    case 'addWeight':
      return syncProfileWeight({
        ...state,
        weightHistory: [...state.weightHistory, weightEntry(action.entry, state.profile.heightCm)],
      });

    case 'deleteWeight':
      return syncProfileWeight({ ...state, weightHistory: state.weightHistory.filter((entry) => entry.id !== action.id) });

    case 'setGoal': {
      const sameTarget = state.goals.targetWeightKg != null && Math.abs(state.goals.targetWeightKg - action.goal.targetWeightKg) < 0.05;
      return {
        ...state,
        goals: {
          targetWeightKg: action.goal.targetWeightKg,
          weeklyWeightChangeKg: action.goal.weeklyWeightChangeKg,
          // Progress is measured from the weight on the day the target was set.
          startWeightKg: sameTarget ? state.goals.startWeightKg : action.currentWeightKg,
          setOn: sameTarget ? state.goals.setOn : todayISO(),
        },
      };
    }

    case 'clearGoal':
      return { ...state, goals: createEmptyData().goals };

    case 'saveWorkout': {
      const exists = state.workouts.some((workout) => workout.id === action.workout.id);
      const workouts = exists
        ? state.workouts.map((workout) => (workout.id === action.workout.id ? { ...workout, ...action.workout } : workout))
        : [...state.workouts, { ...action.workout, id: createId(), createdAt: Date.now() }];
      return { ...state, workouts };
    }

    case 'deleteWorkout':
      return { ...state, workouts: state.workouts.filter((workout) => workout.id !== action.id) };

    case 'addMeasurement':
      return {
        ...state,
        measurements: [...state.measurements, { id: createId(), createdAt: Date.now(), date: action.date, values: action.values }],
      };

    // Removes one value (e.g. waist) from an entry, and the entry itself once it is empty.
    case 'deleteMeasurementValue':
      return {
        ...state,
        measurements: state.measurements
          .map((entry) => {
            if (entry.id !== action.id) return entry;
            const values = { ...entry.values };
            delete values[action.key];
            return { ...entry, values };
          })
          .filter((entry) => Object.keys(entry.values).length > 0),
      };

    case 'saveActivity': {
      const others = state.dailyActivity.filter((day) => day.date !== action.activity.date);
      const { steps, activeMinutes, calories } = action.activity;
      const empty = steps == null && activeMinutes == null && calories == null;
      return { ...state, dailyActivity: empty ? others : [...others, action.activity] };
    }

    default:
      return state;
  }
}

export function AthletiqProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, createEmptyData);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const skipNextSave = useRef(true);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const data = await loadData();
      skipNextSave.current = true; // the loaded data is already on disk
      dispatch({ type: 'loaded', data });
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Persist after every change. Forms only dispatch on submit, so this never runs per keystroke.
  useEffect(() => {
    if (status !== 'ready') return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    saveData(state).catch(() => {
      Alert.alert('Could not save', 'Your latest change could not be saved on this device. Please try again.');
    });
  }, [state, status]);

  const actions = useMemo(() => ({
    setUnits: (unitSystem) => dispatch({ type: 'setUnits', unitSystem }),
    saveProfile: (profile) => dispatch({ type: 'saveProfile', profile }),
    addWeight: (entry) => dispatch({ type: 'addWeight', entry }),
    deleteWeight: (id) => dispatch({ type: 'deleteWeight', id }),
    setGoal: (goal, currentWeightKg) => dispatch({ type: 'setGoal', goal, currentWeightKg }),
    clearGoal: () => dispatch({ type: 'clearGoal' }),
    saveWorkout: (workout) => dispatch({ type: 'saveWorkout', workout }),
    deleteWorkout: (id) => dispatch({ type: 'deleteWorkout', id }),
    addMeasurement: (date, values) => dispatch({ type: 'addMeasurement', date, values }),
    deleteMeasurementValue: (id, key) => dispatch({ type: 'deleteMeasurementValue', id, key }),
    saveActivity: (activity) => dispatch({ type: 'saveActivity', activity }),
    clearAll: async () => {
      await clearData();
      dispatch({ type: 'reset' });
    },
  }), []);

  const value = useMemo(() => ({ ...state, status, reload: load, actions }), [state, status, load, actions]);

  return <AthletiqContext.Provider value={value}>{children}</AthletiqContext.Provider>;
}

export function useAthletiq() {
  return useContext(AthletiqContext);
}
