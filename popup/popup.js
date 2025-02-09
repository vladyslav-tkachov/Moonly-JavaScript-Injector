document.getElementById("openScriptManager").addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
});

// Retrieve applicable scripts for the current page
function getApplicableScripts(currentUrl, scripts) {
    return scripts.filter((script) => {
        if (script.matchType === "equals" && currentUrl === script.conditionKey) return true;
        if (script.matchType === "contains" && currentUrl.includes(script.conditionKey)) return true;
        if (script.matchType === "regex") {
            try {
                return new RegExp(script.conditionKey).test(currentUrl);
            } catch (error) {
                console.error("Invalid regex:", error);
            }
        }
        return false;
    });
}

// Render applicable scripts in the popup
function renderScripts(scripts) {
    const scriptList = document.getElementById("scriptList");
    scriptList.innerHTML = "";

    if (scripts.length === 0) {
        scriptList.innerHTML = "<div class='no-scripts'>No applicable scripts.</div>";
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
                executeManualScript(script.code);
            });
            actionsDiv.appendChild(playButton);
        }

        scriptCard.append(detailsDiv, actionsDiv);
        scriptList.appendChild(scriptCard);
    });
}

// Execute manual scripts from popup
function executeManualScript(scriptCode) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) return;
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            world: "MAIN",
            func: (code) => eval(code),
            args: [scriptCode],
        }).then(() => {
            console.log("Manual script executed successfully.");
        }).catch((error) => {
            console.error("Manual script execution failed:", error);
        });
    });
}

// Detect current page and load applicable scripts
chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    const currentUrl = tab.url;
    chrome.storage.local.get("scripts", (result) => {
        const applicableScripts = getApplicableScripts(currentUrl, result.scripts || []);
        renderScripts(applicableScripts);
    });
});
