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

let scripts = JSON.parse(localStorage.getItem("scripts")) || [];
let editingScriptIndex = null;

// Render Scripts
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

// Download Script
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

// Upload Script
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
                    alert("Script uploaded successfully!");
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

// Open and Close Modal
addScriptBtn.addEventListener("click", () => {
    scriptForm.reset();
    editingScriptIndex = null;
    injectTiming.classList.add("hidden");
    createScriptModal.classList.remove("hidden");
});

closeModal.addEventListener("click", () => createScriptModal.classList.add("hidden"));

// Handle Form Submission
scriptForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const newScript = {
        name: document.getElementById("scriptName").value.trim(),
        code: document.getElementById("scriptCode").value.trim(),
        runCondition: document.getElementById("runCondition").value,
        matchType: document.getElementById("matchType").value,
        conditionKey: document.getElementById("conditionKey").value.trim(),
        trigger: manualTrigger.classList.contains("active") ? "manual" : "automatic",
        autoTiming: automaticTrigger.classList.contains("active") ? injectTiming.value : null,
        enabled: true,
    };

    if (!newScript.name || !newScript.code || !newScript.conditionKey) {
        alert("All required fields must be filled!");
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

// Open Edit Modal
function openEditModal(index) {
    editingScriptIndex = index;
    const script = scripts[index];

    document.getElementById("scriptName").value = script.name;
    document.getElementById("scriptCode").value = script.code;
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

    createScriptModal.classList.remove("hidden");
}

// Save Scripts
function saveScripts() {
    localStorage.setItem("scripts", JSON.stringify(scripts));
    chrome.storage.local.set({ scripts });
}

// Trigger Toggle Logic
manualTrigger.addEventListener("click", () => {
    manualTrigger.classList.add("active");
    automaticTrigger.classList.remove("active");
    injectTiming.classList.add("hidden");
    saveNewScript("manual");
});

automaticTrigger.addEventListener("click", () => {
    automaticTrigger.classList.add("active");
    manualTrigger.classList.remove("active");
    injectTiming.classList.remove("hidden");
    saveNewScript("automatic");
});

// Save New Script on Trigger Change
function saveNewScript(triggerType) {
    const newScript = {
        name: document.getElementById("scriptName").value.trim(),
        code: document.getElementById("scriptCode").value.trim(),
        runCondition: document.getElementById("runCondition").value,
        matchType: document.getElementById("matchType").value,
        conditionKey: document.getElementById("conditionKey").value.trim(),
        trigger: triggerType,
        autoTiming: triggerType === "automatic" ? injectTiming.value : null,
        enabled: true,
    };

    if (!newScript.name || !newScript.code || !newScript.conditionKey) {
        return; // Don't save incomplete scripts
    }

    if (editingScriptIndex !== null) {
        scripts[editingScriptIndex] = newScript;
    } else {
        scripts.push(newScript);
    }

    saveScripts();
    renderScripts();
}

// Initial Render
document.addEventListener("DOMContentLoaded", () => {
    renderScripts();
});
