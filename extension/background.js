const ANKICONNECT_URL = "http://localhost:8765";
const MESSAGE_TYPE_REQUEST = "UTANKI_ANKICONNECT_REQUEST";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type !== MESSAGE_TYPE_REQUEST) return;

    const payload = message.payload;
    fetch(ANKICONNECT_URL, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
    })
        .then(async (res) => {
            const resultText = await res.text();
            if (!resultText.trim()) {
                throw new Error(
                    "AnkiConnect returned empty response. Is Anki running with AnkiConnect installed?",
                );
            }
            try {
                return JSON.parse(resultText);
            } catch {
                throw new Error(
                    `Invalid AnkiConnect response: ${resultText.slice(0, 100)}`,
                );
            }
        })
        .then((data) => sendResponse(data))
        .catch(() =>
            sendResponse({
                error: "ANKI_CONNECTION",
            }),
        );

    return true;
});
