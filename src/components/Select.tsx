/**
 * A pick list: looks like a text box with a ▾, and opens a sheet of choices from the bottom of the
 * screen. Optionally lets you type your own instead. Built in JavaScript (not a native menu) so long
 * lists like times scroll well, and it looks the same on iPhone and Android.
 */
import { useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Text, styles as ui } from '@/components/ui';
import { colors, radius } from '@/lib/theme';
import { type Option } from '@/lib/time';

const ROW_HEIGHT = 52;

export function Select({
  value,
  options,
  onChange,
  placeholder,
  title,
  display,
  custom,
  clearLabel,
  scrollTo,
  style,
}: {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  /** Shown in the box when nothing is chosen. */
  placeholder: string;
  /** The heading on the sheet. */
  title: string;
  /** How the chosen value reads in the box (defaults to its option's label, or the value itself). */
  display?: (value: string) => string;
  /** Allows typing your own; this is the typing box's placeholder. */
  custom?: string;
  /** A first choice that clears the value, e.g. "No set time". */
  clearLabel?: string;
  /** With nothing chosen, open the list scrolled to this value (e.g. "07:00"). */
  scrollTo?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const [open, setOpen] = useState(false);
  const shown = value ? (display?.(value) ?? options.find((o) => o.value === value)?.label ?? value) : '';

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}: ${shown || 'not chosen'}`}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [ui.input, styles.box, style, pressed && { opacity: 0.7 }]}>
        <Text size={15} weight={shown ? 600 : 500} color={shown ? colors.ink : colors.faint} numberOfLines={1} style={{ flex: 1 }}>
          {shown || placeholder}
        </Text>
        <Icon name="down" size={16} color={colors.muted} strokeWidth={2.4} />
      </Pressable>
      {open && (
        <Sheet
          title={title}
          value={value}
          options={clearLabel ? [{ value: '', label: clearLabel }, ...options] : options}
          custom={custom}
          scrollTo={scrollTo}
          onClose={() => setOpen(false)}
          onChoose={(choice) => {
            setOpen(false);
            if (choice !== value) onChange(choice);
          }}
        />
      )}
    </>
  );
}

function Sheet({
  title,
  value,
  options,
  custom,
  scrollTo,
  onClose,
  onChoose,
}: {
  title: string;
  value: string;
  options: Option[];
  custom?: string;
  scrollTo?: string;
  onClose: () => void;
  onChoose: (value: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const isPreset = options.some((o) => o.value === value);
  const [typed, setTyped] = useState(isPreset ? '' : value);
  const target = options.findIndex((o) => o.value === (value || scrollTo));
  // Open with the chosen one a little below the top, so a couple of earlier choices show above it.
  const startAt = Math.max(0, target - 2);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <Pressable accessibilityLabel="Close" style={styles.backdrop} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetWrap} pointerEvents="box-none">
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.grabber} />
          <View style={styles.header}>
            <Text weight={900} size={20}>
              {title}
            </Text>
            <Pressable accessibilityRole="button" onPress={onClose} hitSlop={10}>
              <Text weight={700} size={15} color={colors.accentText}>
                Cancel
              </Text>
            </Pressable>
          </View>

          {custom !== undefined && (
            <View style={styles.custom}>
              <TextInput
                value={typed}
                onChangeText={setTyped}
                placeholder={custom}
                placeholderTextColor={colors.faint}
                returnKeyType="done"
                onSubmitEditing={() => typed.trim() && onChoose(typed.trim())}
                style={[ui.input, { flex: 1 }]}
              />
              <Pressable
                accessibilityRole="button"
                disabled={!typed.trim()}
                onPress={() => onChoose(typed.trim())}
                style={[styles.use, !typed.trim() && { opacity: 0.4 }]}>
                <Text weight={800} size={15} color="#FFFFFF">
                  Use
                </Text>
              </Pressable>
            </View>
          )}

          <FlatList
            data={options}
            keyExtractor={(option) => option.value || '(none)'}
            initialScrollIndex={startAt < options.length ? startAt : 0}
            getItemLayout={(_, index) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index })}
            keyboardShouldPersistTaps="handled"
            style={{ flexGrow: 0 }}
            renderItem={({ item }) => {
              const selected = item.value === value;
              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => onChoose(item.value)}
                  style={({ pressed }) => [styles.option, selected && styles.selected, pressed && { backgroundColor: colors.chip }]}>
                  <Text weight={selected ? 800 : 600} size={16} color={item.value ? colors.ink : colors.muted} style={{ flex: 1 }}>
                    {item.label}
                  </Text>
                  {selected && <Icon name="check" size={18} color={colors.accent} strokeWidth={2.6} />}
                </Pressable>
              );
            }}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(20, 35, 27, 0.4)' },
  sheetWrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '75%',
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.big,
    borderTopRightRadius: radius.big,
    paddingHorizontal: 12,
  },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.border, marginTop: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 12 },
  custom: { flexDirection: 'row', gap: 8, paddingHorizontal: 8, paddingBottom: 10 },
  use: { height: 44, paddingHorizontal: 18, borderRadius: radius.small, backgroundColor: colors.accent, justifyContent: 'center' },
  option: {
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: radius.small,
  },
  selected: { backgroundColor: colors.chip },
});
