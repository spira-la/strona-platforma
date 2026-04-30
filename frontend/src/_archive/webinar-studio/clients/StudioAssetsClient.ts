/**
 * Studio Assets Client
 *
 * Manages studio assets for webinar streaming:
 * - Background images (saved to Storage + Firestore)
 * - Corner images
 * - Text banners with animations
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { getDbLazy, getStorageLazy, getAuthLazy } from '@/firebase';

/** Saved background image */
export interface SavedBackground {
  id: string;
  name: string;
  url: string;
  storagePath: string;
  thumbnailUrl?: string;
  webinarId?: string; // Optional - for backwards compatibility, new ones are global
  createdAt: Date;
  createdBy: string;
}

/** Saved corner image (stored in Firestore) */
export interface SavedCornerImage {
  id: string;
  name: string;
  url: string;
  storagePath: string;
  webinarId?: string; // Optional - for backwards compatibility, new ones are global
  createdAt: Date;
  createdBy: string;
}

/** Corner position type */
export type CornerPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/** Active corner image overlay (runtime state) */
export interface CornerImage {
  id: string;
  name: string;
  url: string;
  corner: CornerPosition;
  isVisible: boolean;
  width: number;  // percentage 0-100
  height: number; // percentage 0-100
}

/** Animation types for text banners */
export type BannerAnimation = 'none' | 'fade-in' | 'fade-out' | 'slide-left' | 'slide-right' | 'slide-up' | 'slide-down' | 'bounce' | 'pulse';

/** Position for text banners */
export type BannerPosition =
  | 'top-left' | 'top-center' | 'top-right'
  | 'center-left' | 'center' | 'center-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

/** Animated text banner */
export interface TextBanner {
  id: string;
  text: string;
  position: BannerPosition;
  backgroundColor: string;
  textColor: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  animationIn: BannerAnimation;
  animationOut: BannerAnimation;
  duration: number; // seconds (0 = infinite)
  isVisible: boolean;
  padding: number;
  borderRadius: number;
}

/** Camera slot style for border customization */
export interface CameraSlotStyle {
  slotId: string;
  borderColor?: string;
  borderWidth?: number;
}

/** Speaker name display style */
export interface SpeakerNameStyle {
  showNames: boolean;
  fontSize: number; // 10-24
  fontColor: string;
  backgroundColor: string;
  position: 'bottom-left' | 'bottom-center' | 'bottom-right' | 'top-left' | 'top-center' | 'top-right';
  padding: number; // 2-12
  borderRadius: number; // 0-12
}

/** Default speaker name style */
export const DEFAULT_SPEAKER_NAME_STYLE: SpeakerNameStyle = {
  showNames: true,
  fontSize: 14,
  fontColor: '#ffffff',
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  position: 'bottom-left',
  padding: 4,
  borderRadius: 4,
};

/** Saved scene configuration */
export interface SavedSceneConfig {
  id: string;
  name: string;
  isDefault: boolean;

  // Webinar association - optional for backwards compatibility, new ones are global
  webinarId?: string;

  // Background settings
  background: {
    type: 'color' | 'image';
    value: string; // hex color or URL
  };

  // Layout template
  templateId?: string;

  // Camera settings
  cameraScale: number;
  cameraSlotStyles: CameraSlotStyle[];

  // Corner images
  cornerImages: CornerImage[];

  // Text banners (saved for quick access)
  textBanners: TextBanner[];

  // Speaker name styling
  speakerNameStyle?: SpeakerNameStyle;

  // Custom speaker display names (participantId -> displayName)
  speakerDisplayNames?: Record<string, string>;

  // Overlay visibility
  overlayVisibility: Record<string, boolean>;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // Who created/last modified this config
}

class StudioAssetsClientClass {
  private readonly COLLECTION_NAME = 'studio_backgrounds';
  private readonly CORNER_COLLECTION_NAME = 'studio_corner_images';
  private readonly CONFIG_COLLECTION_NAME = 'studio_scene_configs';
  private readonly STORAGE_FOLDER = 'studio-assets';

  /**
   * Get current user ID
   */
  private getCurrentUserId(): string {
    const user = getAuthLazy().currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    return user.uid;
  }

  /**
   * Get all saved backgrounds (global - shared across all webinars)
   * @param _webinarId - Deprecated, kept for backwards compatibility but ignored
   */
  async getSavedBackgrounds(_webinarId?: string): Promise<SavedBackground[]> {
    try {
      const db = getDbLazy();
      // Get all backgrounds (global) - no webinarId filter
      const q = query(
        collection(db, this.COLLECTION_NAME),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: (docSnap.data().createdAt as Timestamp)?.toDate() || new Date(),
      })) as SavedBackground[];
    } catch (error) {
      console.error('Failed to get saved backgrounds:', error);
      return [];
    }
  }

  /**
   * Upload and save a background image (global - shared across all webinars)
   * @param _webinarId - Deprecated, kept for backwards compatibility but ignored
   */
  async uploadBackground(file: File, _webinarId?: string, name?: string): Promise<SavedBackground> {
    const userId = this.getCurrentUserId();
    const storage = getStorageLazy();
    const db = getDbLazy();

    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Only image files are allowed');
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('File size must be less than 5MB');
    }

    // Generate unique filename - stored globally (not per webinar)
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const storagePath = `${this.STORAGE_FOLDER}/backgrounds/global/${filename}`;

    // Upload to Firebase Storage
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    // Save metadata to Firestore (no webinarId - global)
    const docRef = await addDoc(collection(db, this.COLLECTION_NAME), {
      name: name || file.name.replace(/\.[^/.]+$/, ''),
      url,
      storagePath,
      createdAt: serverTimestamp(),
      createdBy: userId,
    });

    return {
      id: docRef.id,
      name: name || file.name.replace(/\.[^/.]+$/, ''),
      url,
      storagePath,
      createdAt: new Date(),
      createdBy: userId,
    };
  }

  /**
   * Delete a saved background
   */
  async deleteBackground(id: string, storagePath: string): Promise<void> {
    try {
      const storage = getStorageLazy();
      const db = getDbLazy();

      // Delete from Storage
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef).catch(() => {
        // Ignore if file doesn't exist
      });

      // Delete from Firestore
      await deleteDoc(doc(db, this.COLLECTION_NAME, id));
    } catch (error) {
      console.error('Failed to delete background:', error);
      throw new Error('Failed to delete background');
    }
  }

  /**
   * Get all saved corner images (global - shared across all webinars)
   * @param _webinarId - Deprecated, kept for backwards compatibility but ignored
   */
  async getSavedCornerImages(_webinarId?: string): Promise<SavedCornerImage[]> {
    try {
      const db = getDbLazy();
      // Get all corner images (global) - no webinarId filter
      const q = query(
        collection(db, this.CORNER_COLLECTION_NAME),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: (docSnap.data().createdAt as Timestamp)?.toDate() || new Date(),
      })) as SavedCornerImage[];
    } catch (error) {
      console.error('Failed to get saved corner images:', error);
      return [];
    }
  }

  /**
   * Upload and save a corner image (global - shared across all webinars)
   * @param _webinarId - Deprecated, kept for backwards compatibility but ignored
   */
  async uploadCornerImage(file: File, _webinarId?: string, name?: string): Promise<SavedCornerImage> {
    const userId = this.getCurrentUserId();
    const storage = getStorageLazy();
    const db = getDbLazy();

    // Validate file type
    if (!file.type.startsWith('image/') && file.type !== 'image/gif') {
      throw new Error('Only image files are allowed');
    }

    // Validate file size (max 5MB for corner images)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('File size must be less than 5MB');
    }

    // Generate unique filename - stored globally (not per webinar)
    const ext = file.name.split('.').pop() || 'png';
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const storagePath = `${this.STORAGE_FOLDER}/corners/global/${filename}`;

    // Upload to Firebase Storage
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    // Save metadata to Firestore (no webinarId - global)
    const docRef = await addDoc(collection(db, this.CORNER_COLLECTION_NAME), {
      name: name || file.name.replace(/\.[^/.]+$/, ''),
      url,
      storagePath,
      createdAt: serverTimestamp(),
      createdBy: userId,
    });

    return {
      id: docRef.id,
      name: name || file.name.replace(/\.[^/.]+$/, ''),
      url,
      storagePath,
      createdAt: new Date(),
      createdBy: userId,
    };
  }

  /**
   * Delete a saved corner image
   */
  async deleteCornerImage(id: string, storagePath: string): Promise<void> {
    try {
      const storage = getStorageLazy();
      const db = getDbLazy();

      // Delete from Storage
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef).catch(() => {
        // Ignore if file doesn't exist
      });

      // Delete from Firestore
      await deleteDoc(doc(db, this.CORNER_COLLECTION_NAME, id));
    } catch (error) {
      console.error('Failed to delete corner image:', error);
      throw new Error('Failed to delete corner image');
    }
  }

  /**
   * Create default text banner settings
   */
  createDefaultTextBanner(): Omit<TextBanner, 'id'> {
    return {
      text: '',
      position: 'bottom-center',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      textColor: '#ffffff',
      fontSize: 24,
      fontWeight: 'bold',
      animationIn: 'slide-up',
      animationOut: 'fade-out',
      duration: 5,
      isVisible: false,
      padding: 16,
      borderRadius: 8,
    };
  }

  /**
   * Create default corner image settings
   */
  createDefaultCornerImage(corner: CornerImage['corner']): Omit<CornerImage, 'id' | 'url'> {
    return {
      name: '',
      corner,
      isVisible: true,
      width: 15,
      height: 15,
    };
  }

  // ============================================
  // Scene Configuration Methods
  // ============================================

  /**
   * Get all saved scene configs (global - shared across all webinars)
   * @param _webinarId - Deprecated, kept for backwards compatibility but ignored
   */
  async getSavedSceneConfigs(_webinarId?: string): Promise<SavedSceneConfig[]> {
    try {
      const db = getDbLazy();
      // Get all scene configs (global) - no webinarId filter
      const q = query(
        collection(db, this.CONFIG_COLLECTION_NAME),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: (docSnap.data().createdAt as Timestamp)?.toDate() || new Date(),
        updatedAt: (docSnap.data().updatedAt as Timestamp)?.toDate() || new Date(),
      })) as SavedSceneConfig[];
    } catch (error) {
      console.error('Failed to get saved scene configs:', error);
      return [];
    }
  }

  /**
   * Get a single scene config by ID
   */
  async getSceneConfigById(id: string): Promise<SavedSceneConfig | null> {
    try {
      const db = getDbLazy();
      const docRef = doc(db, this.CONFIG_COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: (docSnap.data().createdAt as Timestamp)?.toDate() || new Date(),
        updatedAt: (docSnap.data().updatedAt as Timestamp)?.toDate() || new Date(),
      } as SavedSceneConfig;
    } catch (error) {
      console.error('Failed to get scene config:', error);
      return null;
    }
  }

  /**
   * Get the default scene config (global - shared across all webinars)
   * @param _webinarId - Deprecated, kept for backwards compatibility but ignored
   */
  async getDefaultSceneConfig(_webinarId?: string): Promise<SavedSceneConfig | null> {
    try {
      const db = getDbLazy();
      // Get the global default config - no webinarId filter
      const q = query(
        collection(db, this.CONFIG_COLLECTION_NAME),
        where('isDefault', '==', true),
        limit(1)
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return null;
      }

      const docSnap = snapshot.docs[0];
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: (docSnap.data().createdAt as Timestamp)?.toDate() || new Date(),
        updatedAt: (docSnap.data().updatedAt as Timestamp)?.toDate() || new Date(),
      } as SavedSceneConfig;
    } catch (error) {
      console.error('Failed to get default scene config:', error);
      return null;
    }
  }

  /**
   * Save a new scene configuration (global - shared across all webinars)
   */
  async saveSceneConfig(config: Omit<SavedSceneConfig, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<SavedSceneConfig> {
    const userId = this.getCurrentUserId();
    const db = getDbLazy();

    // If this is being set as default, unset any existing global default
    if (config.isDefault) {
      await this.unsetDefaultConfigs();
    }

    // Don't save webinarId - configs are now global
    const { webinarId: _webinarId, ...configWithoutWebinarId } = config;

    const docRef = await addDoc(collection(db, this.CONFIG_COLLECTION_NAME), {
      ...configWithoutWebinarId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: userId,
    });

    return {
      id: docRef.id,
      ...configWithoutWebinarId,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
    };
  }

  /**
   * Update an existing scene configuration
   * @param _webinarId - Deprecated, kept for backwards compatibility but ignored
   */
  async updateSceneConfig(id: string, updates: Partial<Omit<SavedSceneConfig, 'id' | 'createdAt' | 'createdBy'>>, _webinarId?: string): Promise<void> {
    const db = getDbLazy();

    // If this is being set as default, unset any existing global default
    if (updates.isDefault) {
      await this.unsetDefaultConfigs();
    }

    // Don't save webinarId - configs are now global
    const { webinarId: _wId, ...updatesWithoutWebinarId } = updates;

    await updateDoc(doc(db, this.CONFIG_COLLECTION_NAME, id), {
      ...updatesWithoutWebinarId,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Delete a scene configuration
   */
  async deleteSceneConfig(id: string): Promise<void> {
    try {
      const db = getDbLazy();
      await deleteDoc(doc(db, this.CONFIG_COLLECTION_NAME, id));
    } catch (error) {
      console.error('Failed to delete scene config:', error);
      throw new Error('Failed to delete scene configuration');
    }
  }

  /**
   * Set a config as the global default (unsets any existing default)
   * @param _webinarId - Deprecated, kept for backwards compatibility but ignored
   */
  async setDefaultConfig(id: string, _webinarId?: string): Promise<void> {
    await this.unsetDefaultConfigs();
    await this.updateSceneConfig(id, { isDefault: true });
  }

  /**
   * Unset all global default configs
   * @param _webinarId - Deprecated, kept for backwards compatibility but ignored
   */
  private async unsetDefaultConfigs(_webinarId?: string): Promise<void> {
    try {
      const db = getDbLazy();
      // Unset all defaults globally - no webinarId filter
      const q = query(
        collection(db, this.CONFIG_COLLECTION_NAME),
        where('isDefault', '==', true)
      );

      const snapshot = await getDocs(q);
      const updatePromises = snapshot.docs.map(docSnap =>
        updateDoc(doc(db, this.CONFIG_COLLECTION_NAME, docSnap.id), { isDefault: false })
      );

      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Failed to unset default configs:', error);
    }
  }

  /**
   * Create a default scene config object (global - shared across all webinars)
   * @param _webinarId - Deprecated, kept for backwards compatibility but ignored
   */
  createDefaultSceneConfigData(_webinarId?: string): Omit<SavedSceneConfig, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> {
    return {
      name: 'Default Configuration',
      isDefault: true,
      background: {
        type: 'color',
        value: '#1e293b',
      },
      templateId: undefined,
      cameraScale: 1,
      cameraSlotStyles: [],
      cornerImages: [],
      textBanners: [],
      overlayVisibility: {},
    };
  }
}

// Singleton instance
export const studioAssetsClient = new StudioAssetsClientClass();
