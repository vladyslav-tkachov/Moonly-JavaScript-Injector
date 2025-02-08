document.getElementById("openScriptManager").addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
});

function getApplicableScripts(currentUrl, scripts) {
    return scripts.filter((script) => {
        if (script.matchType === "equals" && currentUrl === script.conditionKey) return true;
        if (script.matchType === "contains" && currentUrl.includes(script.conditionKey)) return true;
        if (script.matchType === "regex") {
            try {
                const regex = new RegExp(script.conditionKey);
                return regex.test(currentUrl);
            } catch (error) {
                console.error("Invalid regex:", error);
            }
        }
        return false;
    });
}

function renderScripts(scripts) {
    const scriptList = document.getElementById("scriptList");
    scriptList.innerHTML = "";

    if (scripts.length === 0) {
        const emptyMessage = document.createElement("div");
        emptyMessage.textContent = "No applicable scripts.";
        emptyMessage.style.textAlign = "center";
        emptyMessage.style.color = "#666";
        scriptList.appendChild(emptyMessage);
        return;
    }

    scripts.forEach((script) => {
        const scriptCard = document.createElement("div");
        scriptCard.className = "script-card";

        const detailsDiv = document.createElement("div");
        detailsDiv.className = "script-details";
        detailsDiv.innerHTML = `
      <div class="script-title">${script.name}</div>
      <div class="script-type">${script.trigger === "manual" ? "Manual" : "Automatic"}</div>
    `;

        const actionsDiv = document.createElement("div");
        actionsDiv.className = "script-actions";

        if (script.trigger === "manual") {
            const playButton = document.createElement("button");
            playButton.className = "action-btn";
            playButton.innerHTML = `<img src="../icons/play128.png" alt="Play">`;
            playButton.addEventListener("click", () => {
                chrome.scripting.executeScript({
                    target: { allFrames: true },
                    func: new Function(script.code),
                });
            });
            actionsDiv.appendChild(playButton);
        }

        scriptCard.append(detailsDiv, actionsDiv);
        scriptList.appendChild(scriptCard);
    });
}

chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    const currentUrl = tab.url;
    chrome.storage.local.get("scripts", (result) => {
        const allScripts = result.scripts || [];
        const applicableScripts = getApplicableScripts(currentUrl, allScripts);
        renderScripts(applicableScripts);
    });
});
