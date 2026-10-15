/**
 * A page's photos: a grid of thumbnails with a tile to add more (camera or library), and a full-size
 * view with a caption. `readOnly` is the family's view (the preview), with no adding or removing.
 */
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Modal, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { SheetFrame, Text } from '@/components/ui';
import { forget, keep, photoFile } from '@/lib/media';
import { newId, type Photo } from '@/lib/store';
import { colors, fonts } from '@/lib/theme';

type Props = {
  photos: Photo[];
  onAdd?: (photos: Photo[]) => void;
  onRemove?: (photo: Photo) => void;
  onCaption?: (photo: Photo, caption: string) => void;
  readOnly?: boolean;
  hint?: string;
  addTile?: boolean;
};

/** Takes a photo, or picks some from the library, and saves them on the phone. */
async function add(from: 'camera' | 'library'): Promise<Photo[]> {
  let result: ImagePicker.ImagePickerResult;
  if (from === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera is off', 'To take a photo, allow the camera for Left in Love in your phone’s Settings app.');
      return [];
    }
    result = await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 0.7 });
  } else {
    result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.7, allowsMultipleSelection: true, selectionLimit: 10 });
  }
  if (result.canceled) return [];
  const added: Photo[] = [];
  for (const asset of result.assets) {
    const id = newId();
    await keep(asset.uri, photoFile(id));
    added.push({ id });
  }
  return added;
}

/** Asks camera or library, then hands back what was added (nothing if cancelled). */
export const choosePhotos = (onAdd: (photos: Photo[]) => void) => {
  const go = async (from: 'camera' | 'library') => {
    const added = await add(from);
    if (added.length) onAdd(added);
  };
  if (Platform.OS === 'web') go('library');
  else
    Alert.alert('Add a photo', undefined, [
      { text: 'Take a photo', onPress: () => go('camera') },
      { text: 'Choose from your photos', onPress: () => go('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);
};

/** `addTile={false}`: the screen has its own add button (a page's tool bar), so the grid shows only photos. */
export function Photos({ photos, onAdd, onRemove, onCaption, readOnly, hint, addTile = true }: Props) {
  const [open, setOpen] = useState<Photo | null>(null);
  const choose = () => choosePhotos((added) => onAdd?.(added));

  const remove = (photo: Photo) =>
    Alert.alert('Delete this photo?', 'It will be removed from this page. The original stays in your photo library.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setOpen(null);
          forget(photoFile(photo.id));
          onRemove?.(photo);
        },
      },
    ]);

  if ((readOnly || !addTile) && !photos.length) return null;

  return (
    <View style={{ gap: 8 }}>
      <View style={styles.grid}>
        {photos.map((photo) => (
          <Pressable key={photo.id} accessibilityRole="imagebutton" accessibilityLabel={photo.caption || 'Photo'} onPress={() => setOpen(photo)} style={styles.cell}>
            <Image source={{ uri: photoFile(photo.id).uri }} style={styles.thumb} contentFit="cover" transition={150} />
          </Pressable>
        ))}
        {!readOnly && addTile && (
          <Pressable accessibilityRole="button" accessibilityLabel="Add a photo" onPress={choose} style={({ pressed }) => [styles.cell, styles.add, pressed && { borderColor: colors.accent }]}>
            <Icon name="photo" size={22} />
            <Text size={12} color={colors.muted}>
              Add
            </Text>
          </Pressable>
        )}
      </View>
      {!readOnly && addTile && !photos.length && hint ? (
        <Text size={13} color={colors.faint} style={{ paddingHorizontal: 4 }}>
          {hint}
        </Text>
      ) : null}
      <Viewer
        photo={open && (photos.find((item) => item.id === open.id) ?? null)}
        readOnly={readOnly}
        onClose={() => setOpen(null)}
        onRemove={remove}
        onCaption={(photo, caption) => onCaption?.(photo, caption)}
      />
    </View>
  );
}

/** One photo, full size, with its caption. */
function Viewer({ photo, readOnly, onClose, onRemove, onCaption }: { photo: Photo | null; readOnly?: boolean; onClose: () => void; onRemove: (photo: Photo) => void; onCaption: (photo: Photo, caption: string) => void }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={!!photo} animationType="fade" onRequestClose={onClose} transparent>
      <SheetFrame>
        {photo && (
          <View style={[styles.viewer, { paddingTop: insets.top + 8, paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
            <View style={styles.bar}>
              <Pressable accessibilityRole="button" accessibilityLabel="Close" hitSlop={8} onPress={onClose} style={styles.round}>
                <Icon name="close" size={16} color={colors.ink} strokeWidth={2} />
              </Pressable>
              {!readOnly && (
                <Pressable accessibilityRole="button" accessibilityLabel="Delete this photo" hitSlop={8} onPress={() => onRemove(photo)} style={styles.round}>
                  <Icon name="trash" size={16} color={colors.ink} />
                </Pressable>
              )}
            </View>
            <Image source={{ uri: photoFile(photo.id).uri }} style={{ flex: 1 }} contentFit="contain" />
            {readOnly ? (
              photo.caption?.trim() ? (
                <Text size={16} color={colors.soft} style={{ textAlign: 'center', paddingHorizontal: 8 }}>
                  {photo.caption}
                </Text>
              ) : null
            ) : (
              <TextInput
                value={photo.caption ?? ''}
                onChangeText={(caption) => onCaption(photo, caption)}
                placeholder="A few words about it (optional)"
                placeholderTextColor={colors.faint}
                accessibilityLabel="Caption"
                style={styles.caption}
              />
            )}
          </View>
        )}
      </SheetFrame>
    </Modal>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: { width: '31.5%', aspectRatio: 1, borderRadius: 14, overflow: 'hidden', backgroundColor: colors.card },
  thumb: { width: '100%', height: '100%' },
  add: { borderWidth: 1, borderStyle: 'dashed', borderColor: colors.outline, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center', gap: 4 },
  viewer: { flex: 1, backgroundColor: '#0B0A0F', paddingHorizontal: 16, gap: 14 },
  bar: { flexDirection: 'row', justifyContent: 'space-between' },
  round: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  caption: { height: 48, borderRadius: 14, backgroundColor: colors.card, color: colors.ink, paddingHorizontal: 14, fontFamily: fonts[300], fontSize: 16 },
});
