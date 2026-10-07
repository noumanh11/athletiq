import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import InputField from './InputField';
import { formatLongDate, parseISODate, toISODate } from '../fitness';

// Record date picker (native Android dialog). Works with ISO date strings; future dates are disabled.
export default function DateField({ label = 'Date', value, onChange, style }) {
  function open() {
    DateTimePickerAndroid.open({
      value: parseISODate(value),
      mode: 'date',
      maximumDate: new Date(),
      onValueChange: (event, date) => {
        if (date) onChange(toISODate(date));
      },
    });
  }

  return <InputField style={style} label={label} icon="calendar" displayText={formatLongDate(value)} onPress={open} />;
}
