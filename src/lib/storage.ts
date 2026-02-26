import { supabase } from './supabase';

const BUCKET_NAME = 'product-images';

/**
 * Upload a product image to Supabase Storage.
 * Returns the public URL of the uploaded image.
 */
export async function uploadProductImage(file: File): Promise<string> {
    // Generate a unique filename
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
        });

    if (error) {
        console.error('Upload error:', error);
        throw new Error(`Failed to upload image: ${error.message}`);
    }

    const { data } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

    return data.publicUrl;
}

/**
 * Delete a product image from Supabase Storage.
 */
export async function deleteProductImage(imageUrl: string): Promise<void> {
    // Extract the file path from the URL
    const urlObj = new URL(imageUrl);
    const pathParts = urlObj.pathname.split(`/object/public/${BUCKET_NAME}/`);
    if (pathParts.length < 2) return;

    const filePath = pathParts[1];

    const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);

    if (error) {
        console.error('Delete error:', error);
    }
}

/**
 * Check if a string is a URL (image was uploaded) vs an emoji.
 */
export function isImageUrl(value: string): boolean {
    return value.startsWith('http://') || value.startsWith('https://') || value.startsWith('blob:');
}
