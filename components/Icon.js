import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme';

// One icon set (Material Community Icons) used everywhere so stroke weight and size stay consistent.
// Icons are decorative by default; pass `label` when an icon is the only thing describing an action.
export default function Icon({ name, size = 20, color = colors.ink, label }) {
  return (
    <MaterialCommunityIcons
      name={name}
      size={size}
      color={color}
      accessible={Boolean(label)}
      accessibilityLabel={label}
      importantForAccessibility={label ? 'yes' : 'no-hide-descendants'}
    />
  );
}
