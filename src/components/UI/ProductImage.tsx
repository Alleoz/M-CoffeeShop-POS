'use client';

import { isImageUrl } from '@/lib/storage';
import { Coffee } from 'lucide-react';

interface ProductImageProps {
    image: string;
    name: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

/**
 * Renders a product image — either a real uploaded photo or an emoji fallback.
 * Handles both legacy emoji-based products and new URL-based ones.
 */
export default function ProductImage({ image, name, size = 'md', className = '' }: ProductImageProps) {
    const sizeClasses = {
        sm: 'size-10',
        md: 'size-full',
        lg: 'size-full',
    };

    const textSizes = {
        sm: 'text-xl',
        md: 'text-4xl',
        lg: 'text-5xl',
    };

    if (isImageUrl(image)) {
        return (
            <div className={`${className} overflow-hidden`}>
                <img
                    src={image}
                    alt={name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                />
            </div>
        );
    }

    // Emoji fallback for legacy products
    if (image && image.length <= 4) {
        return (
            <div className={`${className} flex items-center justify-center ${textSizes[size]}`}>
                {image}
            </div>
        );
    }

    // Default placeholder when no image
    return (
        <div className={`${className} flex items-center justify-center`}>
            <Coffee size={size === 'sm' ? 16 : size === 'md' ? 24 : 32} className="text-slate-300 dark:text-slate-600" />
        </div>
    );
}
