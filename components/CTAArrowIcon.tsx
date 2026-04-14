import React from 'react';

export const CTA_ARROW_URL =
  'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/0fea2819-e0b6-4ab2-b4ab-ab4c64535352-oma-mindly-framer-website/assets/svgs/U0c022TYy3iR6YjbwbyxOaDRsk-2.svg';

export const CTAArrowIcon: React.FC<{ className?: string }> = ({
  className = 'w-4 h-[14px] object-contain',
}) => <img src={CTA_ARROW_URL} alt="" width={16} height={14} className={className} />;
