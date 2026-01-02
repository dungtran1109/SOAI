import axiosClient from '../axios/axiosClient';

/**
 * Upload proof images (user role).
 * @param files - A list of proof files.
 * @param cvId - @param cvId - ID of a CV.
 * @returns Object includes a message after uploading proof.
 */
export const uploadProofImages = async (files: FileList, cvId: number): Promise<{ message: string }> => {
    try {
        const formData = new FormData();
        for (const file of files) {
            formData.append('files', file);
        }
        return axiosClient.post(`/cvs/${cvId}/proofs/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    } catch (error) {
        console.error('[DEBUG uploadProofImages]', error);
        return { message: `${error}` };
    }
};
