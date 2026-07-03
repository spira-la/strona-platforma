/**
 * useMediaPermissions Hook
 *
 * Implements the Google Meet approach for media permissions:
 * 1. Pre-prompt: Show custom UI asking user intent before browser prompt
 * 2. Request: Trigger native browser permission prompt
 * 3. Denied: Show device/browser-specific instructions to unblock
 *
 * Key insight from Google Meet case study:
 * - Users who click "Block" often meant to block temporarily
 * - A pre-prompt increases permission grants by ~14%
 * - When denied, only device-specific instructions help (can't re-trigger prompt)
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// ─── Types ───────────────────────────────────────────────

export type PermissionStatus = 'idle' | 'prompt' | 'granted' | 'denied' | 'checking';

export type DeviceType = 'ios-safari' | 'ios-chrome' | 'android-chrome' | 'android-other' | 'desktop-chrome' | 'desktop-firefox' | 'desktop-safari' | 'desktop-other';

/** Human-readable browser name for display */
export type BrowserName = 'Chrome' | 'Edge' | 'Brave' | 'Opera' | 'Firefox' | 'Safari' | 'Arc' | 'Vivaldi' | 'Browser';

export interface PermissionInstructions {
  device: DeviceType;
  steps: string[];
  /** i18n key for each step (for translated versions) */
  stepKeys: string[];
}

/** Browser tab for the permission instructions dialog */
export interface BrowserTab {
  id: DeviceType;
  label: string;
  instructions: PermissionInstructions;
}

export interface UseMediaPermissionsReturn {
  /** Overall permission status */
  status: PermissionStatus;
  /** Whether camera is specifically denied */
  cameraDenied: boolean;
  /** Whether microphone is specifically denied */
  microphoneDenied: boolean;
  /** Request permissions (triggers getUserMedia) */
  requestPermissions: () => Promise<boolean>;
  /** Re-check permissions after user changes settings externally */
  recheckPermissions: () => Promise<void>;
  /** Device/browser-specific instructions for the detected browser */
  instructions: PermissionInstructions;
  /** Detected device type */
  deviceType: DeviceType;
  /** Detected browser display name (e.g. "Chrome", "Edge", "Brave") */
  browserName: BrowserName;
  /** Whether the device is mobile */
  isMobile: boolean;
  /** All browser tabs relevant to this platform (for tabbed UI) */
  browserTabs: BrowserTab[];
}

// ─── Device Detection ────────────────────────────────────

function detectDevice(): DeviceType {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);
  const isFirefox = /Firefox/.test(ua);
  // Chromium-based: Chrome, Edge, Brave, Opera, Arc, Vivaldi all share the same permissions UI
  const isChromium = /Chrome/.test(ua) && !isFirefox;
  const isSafari = /Safari/.test(ua) && !isChromium && !isFirefox;

  if (isIOS && isSafari) return 'ios-safari';
  if (isIOS) return 'ios-chrome'; // Chrome/other browsers on iOS use WebKit underneath
  if (isAndroid && isChromium) return 'android-chrome';
  if (isAndroid) return 'android-other';
  if (isFirefox) return 'desktop-firefox';
  if (isSafari) return 'desktop-safari';
  if (isChromium) return 'desktop-chrome'; // Chrome, Edge, Brave, Opera, Arc, Vivaldi
  return 'desktop-other';
}

function isMobileDevice(device: DeviceType): boolean {
  return device.startsWith('ios') || device.startsWith('android');
}

function detectBrowserName(): BrowserName {
  const ua = navigator.userAgent;
  // Order matters: check specific browsers before generic Chrome
  if (/Edg/.test(ua)) return 'Edge';
  if (/Brave/.test(ua) || (navigator as { brave?: unknown }).brave) return 'Brave';
  if (/OPR|Opera/.test(ua)) return 'Opera';
  if (/Arc/.test(ua)) return 'Arc';
  if (/Vivaldi/.test(ua)) return 'Vivaldi';
  if (/Firefox/.test(ua)) return 'Firefox';
  if (/Chrome/.test(ua)) return 'Chrome';
  if (/Safari/.test(ua)) return 'Safari';
  return 'Browser';
}

/**
 * Get all relevant browser tabs for the current platform.
 * Desktop: Chromium (Chrome/Edge/Brave), Firefox, Safari
 * Mobile: shows only the detected device instructions
 */
function getBrowserTabs(device: DeviceType, detectedBrowser: BrowserName): BrowserTab[] {
  // On mobile, just show the single detected device instructions
  if (isMobileDevice(device)) {
    return [{
      id: device,
      label: detectedBrowser,
      instructions: getInstructions(device),
    }];
  }

  // On desktop, show tabs for all major browser families
  const tabs: BrowserTab[] = [
    {
      id: 'desktop-chrome',
      label: 'Chrome / Edge / Brave',
      instructions: getInstructions('desktop-chrome'),
    },
    {
      id: 'desktop-firefox',
      label: 'Firefox',
      instructions: getInstructions('desktop-firefox'),
    },
    {
      id: 'desktop-safari',
      label: 'Safari',
      instructions: getInstructions('desktop-safari'),
    },
  ];

  return tabs;
}

// ─── Instructions per device ─────────────────────────────

function getInstructions(device: DeviceType): PermissionInstructions {
  switch (device) {
    case 'ios-safari':
      return {
        device,
        steps: [
          'Open your iPhone Settings app',
          'Scroll down and tap Safari',
          'Tap Camera (or Microphone)',
          'Select "Allow"',
          'Return here and tap the button below',
        ],
        stepKeys: [
          'meeting.permissions.instructions.iosSafari.step1',
          'meeting.permissions.instructions.iosSafari.step2',
          'meeting.permissions.instructions.iosSafari.step3',
          'meeting.permissions.instructions.iosSafari.step4',
          'meeting.permissions.instructions.iosSafari.step5',
        ],
      };

    case 'ios-chrome':
      return {
        device,
        steps: [
          'Open your iPhone Settings app',
          'Scroll down and tap Chrome',
          'Enable Camera and Microphone',
          'Return here and tap the button below',
        ],
        stepKeys: [
          'meeting.permissions.instructions.iosChrome.step1',
          'meeting.permissions.instructions.iosChrome.step2',
          'meeting.permissions.instructions.iosChrome.step3',
          'meeting.permissions.instructions.iosChrome.step4',
        ],
      };

    case 'android-chrome':
      return {
        device,
        steps: [
          'Tap the lock icon 🔒 in the address bar',
          'Tap "Permissions"',
          'Enable Camera and Microphone',
          'Reload the page',
        ],
        stepKeys: [
          'meeting.permissions.instructions.androidChrome.step1',
          'meeting.permissions.instructions.androidChrome.step2',
          'meeting.permissions.instructions.androidChrome.step3',
          'meeting.permissions.instructions.androidChrome.step4',
        ],
      };

    case 'android-other':
      return {
        device,
        steps: [
          'Open your browser settings',
          'Find Site Settings → Camera / Microphone',
          'Allow access for this site',
          'Reload the page',
        ],
        stepKeys: [
          'meeting.permissions.instructions.androidOther.step1',
          'meeting.permissions.instructions.androidOther.step2',
          'meeting.permissions.instructions.androidOther.step3',
          'meeting.permissions.instructions.androidOther.step4',
        ],
      };

    case 'desktop-chrome':
      return {
        device,
        steps: [
          'Click the camera icon or lock 🔒 in the address bar',
          'Set Camera and Microphone to "Allow"',
          'Click the button below to retry',
        ],
        stepKeys: [
          'meeting.permissions.instructions.desktopChrome.step1',
          'meeting.permissions.instructions.desktopChrome.step2',
          'meeting.permissions.instructions.desktopChrome.step3',
        ],
      };

    case 'desktop-firefox':
      return {
        device,
        steps: [
          'Click the camera/microphone icon in the address bar',
          'Remove the block for Camera and Microphone',
          'Click the button below to retry',
        ],
        stepKeys: [
          'meeting.permissions.instructions.desktopFirefox.step1',
          'meeting.permissions.instructions.desktopFirefox.step2',
          'meeting.permissions.instructions.desktopFirefox.step3',
        ],
      };

    case 'desktop-safari':
      return {
        device,
        steps: [
          'Go to Safari → Settings → Websites',
          'Find Camera and Microphone in the sidebar',
          'Set this site to "Allow"',
          'Click the button below to retry',
        ],
        stepKeys: [
          'meeting.permissions.instructions.desktopSafari.step1',
          'meeting.permissions.instructions.desktopSafari.step2',
          'meeting.permissions.instructions.desktopSafari.step3',
          'meeting.permissions.instructions.desktopSafari.step4',
        ],
      };

    default:
      return {
        device,
        steps: [
          'Open your browser settings',
          'Allow Camera and Microphone for this site',
          'Click the button below to retry',
        ],
        stepKeys: [
          'meeting.permissions.instructions.default.step1',
          'meeting.permissions.instructions.default.step2',
          'meeting.permissions.instructions.default.step3',
        ],
      };
  }
}

// ─── Permission Query ────────────────────────────────────

async function queryPermissionState(name: string): Promise<'prompt' | 'granted' | 'denied' | null> {
  try {
    if (!navigator.permissions?.query) return null;
    const result = await navigator.permissions.query({ name: name as PermissionName });
    return result.state as 'prompt' | 'granted' | 'denied';
  } catch {
    return null;
  }
}

// ─── Hook ────────────────────────────────────────────────

export function useMediaPermissions(): UseMediaPermissionsReturn {
  const [status, setStatus] = useState<PermissionStatus>('idle');
  const [cameraDenied, setCameraDenied] = useState(false);
  const [microphoneDenied, setMicrophoneDenied] = useState(false);
  const mountedRef = useRef(true);

  const deviceType = detectDevice();
  const browserName = detectBrowserName();
  const isMobile = isMobileDevice(deviceType);
  const instructions = getInstructions(deviceType);
  const browserTabs = getBrowserTabs(deviceType, browserName);

  // Check current permission state via Permissions API
  const recheckPermissions = useCallback(async () => {
    const [cam, mic] = await Promise.all([
      queryPermissionState('camera'),
      queryPermissionState('microphone'),
    ]);

    if (!mountedRef.current) return;

    const camDenied = cam === 'denied';
    const micDenied = mic === 'denied';

    setCameraDenied(camDenied);
    setMicrophoneDenied(micDenied);

    if (camDenied || micDenied) {
      setStatus('denied');
    } else if (cam === 'granted' && mic === 'granted') {
      setStatus('granted');
    } else if (cam === 'granted' || mic === 'granted') {
      // Partial - at least one granted, other might be prompt
      setStatus('granted');
    }
    // If both are 'prompt' or null, keep current status
  }, []);

  // Initial check on mount
  useEffect(() => {
    mountedRef.current = true;

    const initialCheck = async () => {
      setStatus('checking');
      const [cam, mic] = await Promise.all([
        queryPermissionState('camera'),
        queryPermissionState('microphone'),
      ]);

      if (!mountedRef.current) return;

      const camDenied = cam === 'denied';
      const micDenied = mic === 'denied';
      setCameraDenied(camDenied);
      setMicrophoneDenied(micDenied);

      if (camDenied || micDenied) {
        setStatus('denied');
      } else if (cam === 'granted' && mic === 'granted') {
        setStatus('granted');
      } else {
        // 'prompt', null (unsupported), or mixed → show pre-prompt
        setStatus('idle');
      }
    };

    initialCheck();

    // Listen for permission changes (user changed in browser settings)
    let camStatus: globalThis.PermissionStatus | null = null;
    let micStatus: globalThis.PermissionStatus | null = null;

    const setupListeners = async () => {
      try {
        if (!navigator.permissions?.query) return;

        camStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
        camStatus.addEventListener('change', () => {
          if (!mountedRef.current) return;
          const denied = camStatus!.state === 'denied';
          setCameraDenied(denied);
          if (camStatus!.state === 'granted') {
            recheckPermissions();
          } else if (denied) {
            setStatus('denied');
          }
        });

        micStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        micStatus.addEventListener('change', () => {
          if (!mountedRef.current) return;
          const denied = micStatus!.state === 'denied';
          setMicrophoneDenied(denied);
          if (micStatus!.state === 'granted') {
            recheckPermissions();
          } else if (denied) {
            setStatus('denied');
          }
        });
      } catch {
        // Permissions API listeners not supported
      }
    };

    setupListeners();

    return () => {
      mountedRef.current = false;
    };
  }, [recheckPermissions]);

  // Request permissions (triggers native browser prompt)
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    setStatus('checking');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      stream.getTracks().forEach((t) => t.stop());

      if (mountedRef.current) {
        setCameraDenied(false);
        setMicrophoneDenied(false);
        setStatus('granted');
      }
      return true;
    } catch {
      // Try individually to know exactly which is denied
      let camOk = false;
      let micOk = false;

      try {
        const audio = await navigator.mediaDevices.getUserMedia({ audio: true });
        audio.getTracks().forEach((t) => t.stop());
        micOk = true;
      } catch { /* denied */ }

      try {
        const video = await navigator.mediaDevices.getUserMedia({ video: true });
        video.getTracks().forEach((t) => t.stop());
        camOk = true;
      } catch { /* denied */ }

      if (mountedRef.current) {
        setCameraDenied(!camOk);
        setMicrophoneDenied(!micOk);
        setStatus(!camOk || !micOk ? 'denied' : 'granted');
      }

      return camOk && micOk;
    }
  }, []);

  return {
    status,
    cameraDenied,
    microphoneDenied,
    requestPermissions,
    recheckPermissions,
    instructions,
    deviceType,
    browserName,
    isMobile,
    browserTabs,
  };
}
