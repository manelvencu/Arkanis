const TRAINING_PROGRESS_STORAGE_KEY = 'arkanis.training.progress';

export interface TrainingProgress {
  readChestIds: string[];
}

const EMPTY_TRAINING_PROGRESS: TrainingProgress = {
  readChestIds: []
};

export function getTrainingProgress(): TrainingProgress {
  try {
    const raw = window.localStorage.getItem(TRAINING_PROGRESS_STORAGE_KEY);
    if (!raw) return { ...EMPTY_TRAINING_PROGRESS };

    const parsed = JSON.parse(raw) as Partial<TrainingProgress>;
    const readChestIds = Array.isArray(parsed.readChestIds)
      ? parsed.readChestIds.filter((id): id is string => typeof id === 'string')
      : [];

    return { readChestIds: [...new Set(readChestIds)] };
  } catch {
    return { ...EMPTY_TRAINING_PROGRESS };
  }
}

export function markTrainingChestRead(chestId: string): TrainingProgress {
  const progress = getTrainingProgress();
  if (!progress.readChestIds.includes(chestId)) {
    progress.readChestIds.push(chestId);
  }

  try {
    window.localStorage.setItem(TRAINING_PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // The in-memory scene flow can continue even if persistence is unavailable.
  }

  return progress;
}

export function getTrainingReadChestCount(): number {
  return getTrainingProgress().readChestIds.length;
}
