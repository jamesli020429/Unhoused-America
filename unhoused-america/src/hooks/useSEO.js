import { useEffect } from 'react';

export function useSEO({ title, description } = {}) {
    useEffect(() => {
        const baseTitle = "Unhoused America";
        const finalTitle = title ? `${baseTitle} - ${title}` : baseTitle;
        document.title = finalTitle;

        // Update og:title
        let ogTitle = document.querySelector('meta[property="og:title"]');
        if (!ogTitle) {
            ogTitle = document.createElement('meta');
            ogTitle.setAttribute('property', 'og:title');
            document.head.appendChild(ogTitle);
        }
        ogTitle.setAttribute('content', finalTitle);

        // Update og:description
        const defaultDesc = "Unhoused America seeks to unsettle persistent, and often counterproductive, stereotypes about homelessness in the United States";
        const finalDesc = description || defaultDesc;

        let ogDesc = document.querySelector('meta[property="og:description"]');
        if (!ogDesc) {
            ogDesc = document.createElement('meta');
            ogDesc.setAttribute('property', 'og:description');
            document.head.appendChild(ogDesc);
        }
        ogDesc.setAttribute('content', finalDesc);

        // Update standard meta description
        let standardDesc = document.querySelector('meta[name="description"]');
        if (!standardDesc) {
            standardDesc = document.createElement('meta');
            standardDesc.setAttribute('name', 'description');
            document.head.appendChild(standardDesc);
        }
        standardDesc.setAttribute('content', finalDesc);

        // Update og:image
        let ogImage = document.querySelector('meta[property="og:image"]');
        if (!ogImage) {
            ogImage = document.createElement('meta');
            ogImage.setAttribute('property', 'og:image');
            document.head.appendChild(ogImage);
        }
        ogImage.setAttribute('content', window.location.origin + '/UnhousedAmerica-og.png');
    }, [title, description]);
}
