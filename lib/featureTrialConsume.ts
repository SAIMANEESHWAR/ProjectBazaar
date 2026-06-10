import { consumeFeatureUse } from '../services/subscriptionApi';
import type { SubscriptionFeatureId } from './subscriptionFeatures';

/** Record a completed free-trial use for a feature (frontend-triggered). */
export async function recordFeatureTrialUse(
  userId: string,
  featureId: SubscriptionFeatureId,
  sessionId?: string,
  refresh?: () => Promise<void>
): Promise<boolean> {
  try {
    const result = await consumeFeatureUse(userId, featureId, sessionId);
    if (!result.ok) {
      console.warn('recordFeatureTrialUse failed:', result.message);
      return false;
    }
    if (refresh) {
      await refresh();
    }
    return true;
  } catch (e) {
    console.warn('recordFeatureTrialUse failed:', e);
    return false;
  }
}
