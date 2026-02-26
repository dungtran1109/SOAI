/**
 * Jump to a element that has ID in DOM.
 * @param id - ID of element in DOM.
 */
export const handleScrollIntoView = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
    });
};
