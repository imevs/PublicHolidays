export function updatePageMetadata({
    title,
    description,
    keywords,
}: {
    title: string;
    description: string;
    keywords: string;
}) {
    document.title = title;

    const setMetaTag = (nameOrProperty: string, value: string, isProperty = false) => {
        const attr = isProperty ? "property" : "name";
        let meta = document.head.querySelector(`meta[${attr}="${nameOrProperty}"]`);
        if (!meta) {
            meta = document.createElement("meta");
            meta.setAttribute(attr, nameOrProperty);
            document.head.appendChild(meta);
        }
        meta.setAttribute("content", value);
    };

    setMetaTag("description", description);
    setMetaTag("keywords", keywords);
    setMetaTag("og:title", title, true);
    setMetaTag("og:description", description, true);
    setMetaTag("twitter:title", title);
    setMetaTag("twitter:description", description);
}
