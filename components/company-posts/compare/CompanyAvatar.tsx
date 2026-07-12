import * as React from 'react';
import { cn } from '../../../lib/utils';

export const COMPANY_LOGO_FALLBACK = '/codexcareer-logo.png';

export interface CompanyAvatarProps {
    name: string;
    logoUrl?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

const SIZE_CLASSES = {
    sm: 'h-10 w-10',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24',
};

export const CompanyAvatar: React.FC<CompanyAvatarProps> = ({
    name,
    logoUrl,
    size = 'md',
    className,
}) => {
    const [src, setSrc] = React.useState(logoUrl || COMPANY_LOGO_FALLBACK);

    React.useEffect(() => {
        setSrc(logoUrl || COMPANY_LOGO_FALLBACK);
    }, [logoUrl]);

    return (
        <img
            src={src}
            alt={`${name} logo`}
            className={cn(
                'inline-flex shrink-0 rounded-xl object-contain bg-white p-1 shadow-sm',
                SIZE_CLASSES[size],
                className,
            )}
            onError={() => {
                if (src !== COMPANY_LOGO_FALLBACK) {
                    setSrc(COMPANY_LOGO_FALLBACK);
                }
            }}
        />
    );
};
