export const preloadImages = (urls) => {
    return Promise.all(
        urls.map(url => new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        }))
    );
}
