// Client-Side JavaScript Code for Streaming OpenAI API Completions

const promptInput = document.getElementById("promptInput");
const generateBtn = document.getElementById("generateBtn");
const stopBtn = document.getElementById("stopBtn");
const copyBtn = document.getElementById("copyBtn");
const clearBtn = document.getElementById("clearBtn");
const resultText = document.getElementById("resultText");

let controller = null;

const generate = async () => {
    if (!promptInput.value) {
        alert("Please enter a prompt.");
        return;
    }

    generateBtn.disabled = true;
    stopBtn.disabled = false;
    resultText.innerText = "Generating...";

    controller = new AbortController();
    const signal = controller.signal;

    try {
        const response = await fetch('/api/openai', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: promptInput.value }),
            signal,
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        resultText.innerText = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");
            const parsedLines = lines
                .map(line => line.replace(/^data: /, "").trim())
                .filter(line => line !== "" && line !== "[DONE]")
                .map(line => JSON.parse(line));

            for (const parsedLine of parsedLines) {
                const { content } = parsedLine;
                if (content) {
                    resultText.innerText += content;
                }
            }
        }
    } catch (error) {
        if (signal.aborted) {
            resultText.innerText = "Request aborted.";
        } else {
            console.error("Error:", error);
            resultText.innerText = "Error occurred while generating.";
        }
    } finally {
        generateBtn.disabled = false;
        stopBtn.disabled = true;
        controller = null;
    }
};

const stop = () => {
    if (controller) {
        controller.abort();
        controller = null;
    }
};

const copyText = () => {
    navigator.clipboard.writeText(resultText.innerText).then(() => {
        alert("Text copied to clipboard!");
    }).catch(err => {
        console.error("Error copying text to clipboard:", err);
    });
};

const clearText = () => {
    resultText.innerText = "";
};

promptInput.addEventListener("keyup", event => {
    if (event.key === "Enter") {
        generate();
    }
});
generateBtn.addEventListener("click", generate);
stopBtn.addEventListener("click", stop);
copyBtn.addEventListener("click", copyText);
clearBtn.addEventListener("click", clearText);
