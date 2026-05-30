import React from 'react';
import type { SubscriptionFeatureId } from '../../lib/subscriptionFeatures';
import LiveAIPreview from './previews/LiveAIPreview';
import HackathonsPreview from './previews/HackathonsPreview';
import ResumeBuilderPreview from './previews/ResumeBuilderPreview';
import ATSScorerPreview from './previews/ATSScorerPreview';
import CompanyPostsPreview from './previews/CompanyPostsPreview';
import BuildPortfolioPreview from './previews/BuildPortfolioPreview';
import JobHuntPreview from './previews/JobHuntPreview';
import PreparationPreview from './previews/PreparationPreview';
import CodingQuestionsPreview from './previews/CodingQuestionsPreview';

const PREVIEW_MAP: Record<SubscriptionFeatureId, React.FC> = {
  'live-ai': LiveAIPreview,
  hackathons: HackathonsPreview,
  'resume-builder': ResumeBuilderPreview,
  'ats-scorer': ATSScorerPreview,
  'company-posts': CompanyPostsPreview,
  portfolio: BuildPortfolioPreview,
  'job-hunt': JobHuntPreview,
  preparation: PreparationPreview,
  coding: CodingQuestionsPreview,
};

interface FeatureStaticPreviewProps {
  featureId: SubscriptionFeatureId;
}

const FeatureStaticPreview: React.FC<FeatureStaticPreviewProps> = ({ featureId }) => {
  const Preview = PREVIEW_MAP[featureId];
  if (!Preview) {
    return (
      <div className="p-12 min-h-[400px] bg-white flex items-center justify-center">
        <p className="text-gray-400 text-sm">Preview unavailable</p>
      </div>
    );
  }
  return (
    <div className="w-full min-h-full bg-white">
      <Preview />
    </div>
  );
};

export default FeatureStaticPreview;
