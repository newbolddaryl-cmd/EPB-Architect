import { FormData, EngineResult } from '../types';

const DRAFTS_KEY = 'epb_architect_drafts_v1';
const CURRENT_DRAFT_KEY = 'epb_architect_current_v1';
const CURRENT_RESULT_KEY = 'epb_architect_result_v1';

export interface SavedDraft {
  id: string;
  updatedAt: number;
  title: string;
  formData: FormData;
  engineResult?: EngineResult | null;
}

export function saveCurrentState(formData: FormData, engineResult?: EngineResult | null): void {
  try {
    localStorage.setItem(CURRENT_DRAFT_KEY, JSON.stringify(formData));
    if (engineResult) {
      localStorage.setItem(CURRENT_RESULT_KEY, JSON.stringify(engineResult));
    }
  } catch (err) {
    console.warn('Failed to save current state to localStorage:', err);
  }
}

export function loadCurrentState(): { formData: FormData | null; engineResult: EngineResult | null } {
  try {
    const rawForm = localStorage.getItem(CURRENT_DRAFT_KEY);
    const rawResult = localStorage.getItem(CURRENT_RESULT_KEY);
    const formData = rawForm ? JSON.parse(rawForm) : null;
    const engineResult = rawResult ? JSON.parse(rawResult) : null;
    return { formData, engineResult };
  } catch (err) {
    console.warn('Failed to load current state:', err);
    return { formData: null, engineResult: null };
  }
}

export function clearCurrentState(): void {
  try {
    localStorage.removeItem(CURRENT_DRAFT_KEY);
    localStorage.removeItem(CURRENT_RESULT_KEY);
  } catch (err) {
    console.warn('Failed to clear current state:', err);
  }
}

export function getAllSavedDrafts(): SavedDraft[] {
  try {
    const raw = localStorage.getItem(DRAFTS_KEY);
    if (!raw) return [];
    const drafts: SavedDraft[] = JSON.parse(raw);
    return Array.isArray(drafts) ? drafts.sort((a, b) => b.updatedAt - a.updatedAt) : [];
  } catch (err) {
    console.warn('Failed to load saved drafts:', err);
    return [];
  }
}

export function saveDraftToList(formData: FormData, engineResult?: EngineResult | null, customTitle?: string): SavedDraft {
  const drafts = getAllSavedDrafts();
  const id = formData.id || `draft_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const title = customTitle || formData.title || `${formData.productType} - ${formData.rankGrade || 'Draft'} (${formData.afsc || 'General'})`;

  const updatedFormData: FormData = {
    ...formData,
    id,
    title,
    updatedAt: Date.now()
  };

  const existingIndex = drafts.findIndex((d) => d.id === id);
  const draftItem: SavedDraft = {
    id,
    updatedAt: Date.now(),
    title,
    formData: updatedFormData,
    engineResult: engineResult || null
  };

  if (existingIndex >= 0) {
    drafts[existingIndex] = draftItem;
  } else {
    drafts.unshift(draftItem);
  }

  try {
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts.slice(0, 30))); // Keep up to 30 drafts
  } catch (err) {
    console.warn('Failed to persist drafts list:', err);
  }

  return draftItem;
}

export function deleteDraftFromList(id: string): void {
  const drafts = getAllSavedDrafts().filter((d) => d.id !== id);
  try {
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  } catch (err) {
    console.warn('Failed to delete draft:', err);
  }
}
