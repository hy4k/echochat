import { supabase } from "./supabase";

/**
 * Uploads a media file (voice/video) to Supabase Storage
 */
export async function uploadMedia(file: Buffer, fileName: string, contentType: string) {
    const { data, error } = await supabase.storage
        .from('echomedia')
        .upload(fileName, file, {
            contentType,
            upsert: true
        });

    if (error) {
        console.error('[Storage] Upload failed:', error);
        throw error;
    }

    const { data: { publicUrl } } = supabase.storage
        .from('echomedia')
        .getPublicUrl(fileName);

    return publicUrl;
}

/**
 * Deletes a media file from Supabase Storage
 */
export async function deleteMedia(fileName: string) {
    const { error } = await supabase.storage
        .from('echomedia')
        .remove([fileName]);

    if (error) {
        console.error('[Storage] Delete failed:', error);
        throw error;
    }
}
