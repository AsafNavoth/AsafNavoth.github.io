const ALLOWED_ORIGINS = ["https://www.utanki.app", "https://utanki.app"];

const MESSAGE_TYPE_REQUEST = "UTANKI_ANKICONNECT_REQUEST";
const MESSAGE_TYPE_RESPONSE = "UTANKI_ANKICONNECT_RESPONSE";

window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    if (!ALLOWED_ORIGINS.includes(event.origin)) return;

    const { type, id, payload } = event.data || {};
    if (type !== MESSAGE_TYPE_REQUEST || !id || !payload) return;

    chrome.runtime.sendMessage({ type, id, payload }, (response) => {
        const result = response?.result;
        const error = response?.error;
        window.postMessage(
            { type: MESSAGE_TYPE_RESPONSE, id, result, error },
            event.origin,
        );
    });
});
