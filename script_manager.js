const addScriptBtn = document.getElementById("addScriptBtn");
const uploadScriptBtn = document.getElementById("uploadScriptBtn");
const uploadScriptInput = document.getElementById("uploadScriptInput");
const scriptsSection = document.getElementById("scriptsSection");
const emptyMessage = document.getElementById("emptyMessage");
const createScriptModal = document.getElementById("createScriptModal");
const closeModal = document.getElementById("closeModal");
const scriptForm = document.getElementById("scriptForm");
const manualTrigger = document.getElementById("manualTrigger");
const automaticTrigger = document.getElementById("automaticTrigger");
const injectTiming = document.getElementById("injectTiming");
const scriptCodeTextarea = document.getElementById("scriptCode");

let scripts = [];
let editingScriptIndex = null;
let codeEditor;

document.addEventListener("DOMContentLoaded", () => {
    initializeCodeMirror();
    loadScripts();

    manualTrigger.addEventListener("click", () => {
        manualTrigger.classList.add("active");
        automaticTrigger.classList.remove("active");
        injectTiming.classList.add("hidden");

        if (editingScriptIndex !== null) {
            scripts[editingScriptIndex].trigger = "manual";
            scripts[editingScriptIndex].autoTiming = null;
            saveScripts();
        }
    });

    automaticTrigger.addEventListener("click", () => {
        automaticTrigger.classList.add("active");
        manualTrigger.classList.remove("active");
        injectTiming.classList.remove("hidden");

        if (editingScriptIndex !== null) {
            scripts[editingScriptIndex].trigger = "automatic";
            scripts[editingScriptIndex].autoTiming = injectTiming.value;
            saveScripts();
        }
    });

    addScriptBtn.addEventListener("click", () => {
        scriptForm.reset();
        editingScriptIndex = null;
        codeEditor.setValue("");
        setTimeout(() => codeEditor.refresh(), 0);
        createScriptModal.classList.remove("hidden");
    });

    closeModal.addEventListener("click", () => {
        createScriptModal.classList.add("hidden");
    });

    scriptForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const newScript = {
            name: document.getElementById("scriptName").value.trim(),
            code: codeEditor.getValue().trim(),
            runCondition: document.getElementById("runCondition").value,
            matchType: document.getElementById("matchType").value,
            conditionKey: document.getElementById("conditionKey").value.trim(),
            trigger: manualTrigger.classList.contains("active") ? "manual" : "automatic",
            autoTiming: automaticTrigger.classList.contains("active") ? injectTiming.value : null,
            enabled: true,
        };

        if (!newScript.name || !newScript.code) {
            alert("All required fields must be filled! Script name and code are required.");
            return;
        }

        if (editingScriptIndex !== null) {
            scripts[editingScriptIndex] = newScript;
        } else {
            scripts.push(newScript);
        }

        saveScripts();
        renderScripts();
        createScriptModal.classList.add("hidden");
    });

    uploadScriptBtn.addEventListener("click", () => {
        uploadScriptInput.click();
    });

    uploadScriptInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const uploadedScript = JSON.parse(e.target.result);
                    if (uploadedScript.name && uploadedScript.code && uploadedScript.runCondition && uploadedScript.matchType && uploadedScript.conditionKey) {
                        scripts.push(uploadedScript);
                        saveScripts();
                        renderScripts();
                    } else {
                        alert("Invalid script file.");
                    }
                } catch (error) {
                    console.error("Error parsing uploaded script:", error);
                    alert("Failed to upload script.");
                }
            };
            reader.readAsText(file);
        }
    });
});

function initializeCodeMirror() {
    if (!codeEditor) {
        codeEditor = CodeMirror.fromTextArea(scriptCodeTextarea, {
            mode: "javascript",
            theme: "paraiso-light",
            lineNumbers: true,
            autoCloseBrackets: true,
            matchBrackets: true,
            tabSize: 2,
        });
        codeEditor.setSize("100%", "300px");
        codeEditor.refresh();
    }
}

function loadScripts() {
    chrome.storage.local.get("scripts", (result) => {
        scripts = result.scripts || [];
        renderScripts();
    });
}

function saveScripts() {
    chrome.storage.local.set({ scripts }, () => {
        console.log("Scripts saved successfully.");
    });
}

function renderScripts() {
    scriptsSection.innerHTML = "";

    if (scripts.length === 0) {
        emptyMessage.style.display = "block";
    } else {
        emptyMessage.style.display = "none";
        scripts.forEach((script, index) => {
            const scriptItem = document.createElement("div");
            scriptItem.className = "script-item";

            const detailsDiv = document.createElement("div");
            detailsDiv.innerHTML = `
                <div><strong>${script.name}</strong></div>
                <div>Runs on: ${script.runCondition} (${script.matchType}: ${script.conditionKey})</div>
                <div>Trigger: ${script.trigger} ${script.trigger === "automatic" ? `(Timing: ${script.autoTiming})` : ""}</div>
            `;

            const actionsDiv = document.createElement("div");
            actionsDiv.innerHTML = `
                <button class="toggle-btn">${script.enabled ? "Disable" : "Enable"}</button>
                <button class="edit-btn">Edit</button>
                <button class="action-btn">Download</button>
                <button class="action-btn">Delete</button>
            `;

            actionsDiv.querySelector(".toggle-btn").addEventListener("click", () => {
                script.enabled = !script.enabled;
                saveScripts();
                renderScripts();
            });

            actionsDiv.querySelector(".edit-btn").addEventListener("click", () => {
                openEditModal(index);
            });

            actionsDiv.querySelector(".action-btn:nth-child(3)").addEventListener("click", () => {
                downloadScript(script);
            });

            actionsDiv.querySelector(".action-btn:last-child").addEventListener("click", () => {
                scripts.splice(index, 1);
                saveScripts();
                renderScripts();
            });

            scriptItem.append(detailsDiv, actionsDiv);
            scriptsSection.appendChild(scriptItem);
        });
    }
}

function downloadScript(script) {
    const scriptBlob = new Blob([JSON.stringify(script, null, 2)], { type: "application/json" });
    const scriptUrl = URL.createObjectURL(scriptBlob);
    const link = document.createElement("a");
    link.href = scriptUrl;
    link.download = `${script.name}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(scriptUrl);
}

function openEditModal(index) {
    editingScriptIndex = index;
    const script = scripts[index];

    document.getElementById("scriptName").value = script.name;
    document.getElementById("runCondition").value = script.runCondition;
    document.getElementById("matchType").value = script.matchType;
    document.getElementById("conditionKey").value = script.conditionKey;

    if (script.trigger === "manual") {
        manualTrigger.classList.add("active");
        automaticTrigger.classList.remove("active");
        injectTiming.classList.add("hidden");
    } else {
        automaticTrigger.classList.add("active");
        manualTrigger.classList.remove("active");
        injectTiming.classList.remove("hidden");
        injectTiming.value = script.autoTiming;
    }

    codeEditor.setValue(script.code);
    createScriptModal.classList.remove("hidden");
    codeEditor.setOption("mode", "javascript");
    codeEditor.refresh();
}
document.addEventListener("DOMContentLoaded", () => {
    if (!scriptCodeTextarea) {
        console.error("Textarea for CodeMirror not found.");
        return;
    }
    initializeCodeMirror();
});

