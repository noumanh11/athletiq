import { useEffect, useMemo, useState } from 'react';
import { Animated, StyleSheet, Text, useAnimatedValue, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { formatMeasure, formatShortDate, parseISODate } from '../fitness';
import { useReducedMotion } from '../motion';
import { colors, duration, space, type } from '../theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const PAD = { left: 40, right: 12, top: 14, bottom: 26 };

// Minimal line chart for a series of { date, value } points (oldest first).
// The line draws in once; tap or drag to read any point; screen readers can swipe up/down through points.
export default function ProgressChart({ points, unit = '', prefix = '', height = 180, label = 'Chart' }) {
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState(null); // null = latest point
  const draw = useAnimatedValue(0);
  const reduced = useReducedMotion();

  const chart = useMemo(() => {
    if (!width || points.length === 0) return null;
    const innerW = width - PAD.left - PAD.right;
    const innerH = height - PAD.top - PAD.bottom;
    const times = points.map((point) => parseISODate(point.date).getTime());
    const span = times[times.length - 1] - times[0];
    const values = points.map((point) => point.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = Math.max((max - min) * 0.2, 1);
    const low = min - pad;
    const high = max + pad;

    const xs = points.map((point, index) => {
      if (points.length === 1) return PAD.left + innerW / 2;
      // Time-based spacing, falling back to even spacing when every entry shares one date.
      const fraction = span > 0 ? (times[index] - times[0]) / span : index / (points.length - 1);
      return PAD.left + fraction * innerW;
    });
    const ys = values.map((value) => PAD.top + (1 - (value - low) / (high - low)) * innerH);
    const path = xs.map((x, index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[index].toFixed(1)}`).join(' ');
    let length = 0;
    for (let index = 1; index < xs.length; index += 1) length += Math.hypot(xs[index] - xs[index - 1], ys[index] - ys[index - 1]);
    const grid = [high, (high + low) / 2, low].map((value) => ({ value, y: PAD.top + (1 - (value - low) / (high - low)) * innerH }));
    return { xs, ys, path, length: Math.max(length, 1), grid, innerH };
  }, [points, width, height]);

  useEffect(() => {
    if (!chart) return;
    draw.setValue(reduced ? 1 : 0);
    if (!reduced) Animated.timing(draw, { toValue: 1, duration: duration.slow + 200, useNativeDriver: false }).start();
  }, [chart, draw, reduced]);

  const activeIndex = selected == null || selected >= points.length ? points.length - 1 : selected;
  const active = points[activeIndex];
  const readout = active ? `${prefix}${formatMeasure(active.value)}${unit ? ` ${unit}` : ''}` : '';

  function selectAt(x) {
    if (!chart) return;
    let nearest = 0;
    chart.xs.forEach((pointX, index) => {
      if (Math.abs(pointX - x) < Math.abs(chart.xs[nearest] - x)) nearest = index;
    });
    setSelected(nearest);
  }

  function onAccessibilityAction(event) {
    const step = event.nativeEvent.actionName === 'increment' ? 1 : -1;
    setSelected(Math.min(Math.max(activeIndex + step, 0), points.length - 1));
  }

  return (
    <View>
      <View style={styles.readout}>
        <Text style={styles.readoutValue}>{readout}</Text>
        <Text style={styles.readoutDate}>{active ? formatShortDate(active.date) : ''}</Text>
      </View>
      <View
        style={{ height }}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(event) => selectAt(event.nativeEvent.locationX)}
        onResponderMove={(event) => selectAt(event.nativeEvent.locationX)}
        onResponderTerminationRequest={() => true}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={`${label}, ${points.length} ${points.length === 1 ? 'entry' : 'entries'}`}
        accessibilityValue={{ text: active ? `${readout} on ${formatShortDate(active.date)}` : '' }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={onAccessibilityAction}
      >
        {chart ? (
          <Svg width={width} height={height}>
            {chart.grid.map((line) => (
              <Line key={line.y} x1={PAD.left} x2={width - PAD.right} y1={line.y} y2={line.y} stroke={colors.border} strokeWidth={1} />
            ))}
            {chart.grid.map((line) => (
              <SvgText key={`label-${line.y}`} x={PAD.left - 8} y={line.y + 4} fontSize={11} fill={colors.muted} textAnchor="end">
                {formatMeasure(line.value)}
              </SvgText>
            ))}

            <Line
              x1={chart.xs[activeIndex]}
              x2={chart.xs[activeIndex]}
              y1={PAD.top}
              y2={PAD.top + chart.innerH}
              stroke={colors.placeholder}
              strokeWidth={1}
              strokeDasharray="3 4"
            />

            {points.length > 1 ? (
              <AnimatedPath
                d={chart.path}
                fill="none"
                stroke={colors.ink}
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeDasharray={`${chart.length} ${chart.length}`}
                strokeDashoffset={draw.interpolate({ inputRange: [0, 1], outputRange: [chart.length, 0] })}
              />
            ) : null}

            {points.length <= 40
              ? chart.xs.map((x, index) => (
                <Circle key={points[index].id || index} cx={x} cy={chart.ys[index]} r={3.5} fill={colors.surface} stroke={colors.ink} strokeWidth={2} />
              ))
              : null}
            <Circle cx={chart.xs[activeIndex]} cy={chart.ys[activeIndex]} r={7} fill={colors.accent} stroke={colors.ink} strokeWidth={2.5} />

            <SvgText x={PAD.left} y={height - 6} fontSize={11} fill={colors.muted}>{formatShortDate(points[0].date)}</SvgText>
            {points.length > 1 ? (
              <SvgText x={width - PAD.right} y={height - 6} fontSize={11} fill={colors.muted} textAnchor="end">
                {formatShortDate(points[points.length - 1].date)}
              </SvgText>
            ) : null}
          </Svg>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  readout: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: space.sm },
  readoutValue: { ...type.stat, color: colors.ink },
  readoutDate: { ...type.caption, fontWeight: '600', color: colors.muted },
});
