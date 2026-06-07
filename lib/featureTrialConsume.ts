import { consumeFeatureUse } from '../services/subscriptionApi';
import type { SubscriptionFeatureId } from './subscriptionFeatures';

/** Record a completed free-trial use for a feature (frontend-triggered). */
export async function recordFeatureTrialUse(
  userId: string,
  featureId: SubscriptionFeatureId,
  sessionId?: string
): Promise<void> {
  try {
    await consumeFeatureUse(userId, featureId, sessionId);
  } catch (e) {
    console.warn('recordFeatureTrialUse failed:', e);
  }
}
