/**
 * Scene Presets Manager
 *
 * Controls for saving and loading scene configurations including:
 * - Save current scene config with name
 * - Set config as default
 * - Load saved configs
 * - Delete configs
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Save,
  Loader2,
  Trash2,
  Star,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import type { SavedSceneConfig } from '@/clients/StudioAssetsClient';

export interface ScenePresetsManagerProps {
  savedSceneConfigs: SavedSceneConfig[];
  currentConfigId?: string | null;
  isLoadingConfig?: boolean;
  isSavingConfig?: boolean;
  onSaveSceneConfig?: (name: string, setAsDefault: boolean) => Promise<void>;
  onLoadSceneConfig?: (config: SavedSceneConfig) => void;
  onDeleteSceneConfig?: (configId: string) => Promise<void>;
  onSetDefaultConfig?: (configId: string) => Promise<void>;
}

export function ScenePresetsManager({
  savedSceneConfigs,
  currentConfigId,
  isLoadingConfig = false,
  isSavingConfig = false,
  onSaveSceneConfig,
  onLoadSceneConfig,
  onDeleteSceneConfig,
  onSetDefaultConfig,
}: ScenePresetsManagerProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  // Local state
  const [newConfigName, setNewConfigName] = useState('');
  const [setAsDefaultConfig, setSetAsDefaultConfig] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<SavedSceneConfig | null>(null);

  const handleDeleteSceneConfig = useCallback(async (config: SavedSceneConfig) => {
    try {
      await onDeleteSceneConfig?.(config.id);
    } catch (error) {
      console.error('Failed to delete scene config:', error);
    } finally {
      setConfigToDelete(null);
    }
  }, [onDeleteSceneConfig]);

  const handleSaveConfig = useCallback(async () => {
    if (newConfigName.trim() && onSaveSceneConfig) {
      await onSaveSceneConfig(newConfigName.trim(), setAsDefaultConfig);
      setNewConfigName('');
      setSetAsDefaultConfig(false);
    }
  }, [newConfigName, setAsDefaultConfig, onSaveSceneConfig]);

  if (!onSaveSceneConfig) {
    return (
      <p className={cn("text-xs text-center py-4", isDark ? "text-[#e8f5f0]/50" : "text-slate-400")}>
        {t('webinars.scenes.configsNotAvailable', 'Configuration saving not available')}
      </p>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {/* Save Current Config */}
        <div className={cn("p-3 rounded-lg border space-y-2", isDark ? "bg-[#1a352f]/50 border-[#5eb8a8]/30" : "bg-slate-50 border-slate-200")}>
          <Label className={cn("text-xs", isDark ? "text-[#e8f5f0]/70" : "text-slate-500")}>
            {t('webinars.scenes.saveCurrentConfig', 'Save Current Config')}
          </Label>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder={t('webinars.scenes.configName', 'Config name...')}
              value={newConfigName}
              onChange={(e) => setNewConfigName(e.target.value)}
              className={cn("flex-1 h-8 text-sm", isDark ? "bg-[#1a352f]/50 border-[#5eb8a8]/20 text-[#e8f5f0]" : "bg-white border-slate-200 text-slate-900")}
            />
            <Button
              size="sm"
              onClick={handleSaveConfig}
              disabled={!newConfigName.trim() || isSavingConfig}
              className="h-8 bg-[#5eb8a8] hover:bg-[#5eb8a8] text-white"
            >
              {isSavingConfig ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
            </Button>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={setAsDefaultConfig}
              onChange={(e) => setSetAsDefaultConfig(e.target.checked)}
              className={cn("w-3 h-3 rounded", isDark ? "border-[#5eb8a8]/20 bg-[#1a352f]/50 text-[#5eb8a8]" : "border-slate-200 bg-white text-[#285f59]")}
            />
            <span className={cn("text-xs", isDark ? "text-[#e8f5f0]/70" : "text-slate-500")}>
              {t('webinars.scenes.setAsDefault', 'Set as default')}
            </span>
          </label>
        </div>

        {/* Saved Configs List */}
        {isLoadingConfig ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-[#5eb8a8]" />
          </div>
        ) : savedSceneConfigs.length > 0 ? (
          <div className="space-y-1">
            {savedSceneConfigs.map((config) => (
              <div
                key={config.id}
                className={cn(
                  'flex items-center gap-2 p-2 rounded-lg border transition-all',
                  currentConfigId === config.id
                    ? 'border-[#5eb8a8] bg-[#5eb8a8]/20'
                    : isDark ? 'border-transparent bg-[#1a352f]/30 hover:bg-[#1a352f]/50' : 'border-transparent bg-slate-50 hover:bg-slate-100'
                )}
              >
                <button
                  onClick={() => onLoadSceneConfig?.(config)}
                  className="flex-1 text-left"
                >
                  <div className="flex items-center gap-1">
                    <span className={cn("text-sm truncate", isDark ? "text-[#e8f5f0]" : "text-slate-700")}>{config.name}</span>
                    {config.isDefault && (
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    )}
                  </div>
                  <span className={cn("text-xs", isDark ? "text-[#e8f5f0]/50" : "text-slate-400")}>
                    {new Date(config.updatedAt).toLocaleDateString()}
                  </span>
                </button>
                {currentConfigId === config.id && (
                  <Check className="w-4 h-4 text-[#5eb8a8] flex-shrink-0" />
                )}
                {!config.isDefault && onSetDefaultConfig && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onSetDefaultConfig(config.id)}
                    className="w-6 h-6 p-0 hover:bg-yellow-600/20"
                    title={t('webinars.scenes.setAsDefault', 'Set as default')}
                  >
                    <Star className={cn("w-3 h-3 hover:text-yellow-400", isDark ? "text-[#e8f5f0]/50" : "text-slate-400")} />
                  </Button>
                )}
                {onDeleteSceneConfig && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfigToDelete(config)}
                    className="w-6 h-6 p-0 hover:bg-red-600/20"
                  >
                    <Trash2 className={cn("w-3 h-3 hover:text-red-400", isDark ? "text-[#e8f5f0]/50" : "text-slate-400")} />
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className={cn("text-xs text-center py-4", isDark ? "text-[#e8f5f0]/50" : "text-slate-400")}>
            {t('webinars.scenes.noSavedConfigs', 'No saved configurations yet')}
          </p>
        )}
      </div>

      {/* Delete Scene Config Confirmation Dialog */}
      <AlertDialog open={!!configToDelete} onOpenChange={(open) => !open && setConfigToDelete(null)}>
        <AlertDialogContent className={cn(isDark ? "bg-[#0d1f1c] border-[#5eb8a8]/20" : "bg-white border-slate-200")}>
          <AlertDialogHeader>
            <AlertDialogTitle className={cn(isDark ? "text-[#e8f5f0]" : "text-slate-900")}>
              {t('webinars.scenes.deleteConfig', 'Delete Configuration')}
            </AlertDialogTitle>
            <AlertDialogDescription className={cn(isDark ? "text-[#e8f5f0]/70" : "text-slate-500")}>
              {t('webinars.scenes.deleteConfigConfirm', 'Are you sure you want to delete "{{name}}"? This action cannot be undone.', { name: configToDelete?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={cn(isDark ? "bg-[#1a352f] border-[#5eb8a8]/20 text-[#e8f5f0] hover:bg-[#243f39]" : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200")}>
              {t('common.cancel', 'Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => configToDelete && handleDeleteSceneConfig(configToDelete)}
              className="bg-red-600 hover:bg-red-500 text-white"
            >
              {t('common.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default ScenePresetsManager;
