import * as React from 'react';
import { cn } from '../../../lib/utils';
import { companyAvatarColor, companyInitials } from '../../../lib/companyCompareData';

export interface CompanyAvatarProps {
    name: string;
    logoUrl?: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const SIZE_CLASSES = {
    sm: 'h-9 w-9 text-xs',
    md: 'h-11 w-11 text-sm',
    lg: 'h-14 w-14 text-base',
};

export const CompanyAvatar: React.FC<CompanyAvatarProps> = ({
    name,
    logoUrl,
    size = 'md',
    className,
}) => {
    const [imgError, setImgError] = React.useState(false);
    const showLogo = logoUrl && !imgError;

    if (showLogo) {
        return (
            <img
                src={logoUrl}
                alt={`${name} logo`}
                className={cn('inline-flex shrink-0 rounded-xl object-cover shadow-sm bg-white', SIZE_CLASSES[size], className)}
                onError={() => setImgError(true)}
            />
        );
    }

    return (
        <div
            className={cn(
                'inline-flex shrink-0 items-center justify-center rounded-xl font-bold text-white shadow-sm',
                SIZE_CLASSES[size],
                className
            )}
            style={{ backgroundColor: companyAvatarColor(name) }}
            aria-hidden
        >
            {companyInitials(name)}
        </div>
    );
};
