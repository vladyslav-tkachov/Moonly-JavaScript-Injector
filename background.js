// Listen for updates to the script list
chrome.storage.onChanged.addListener((changes) => {
    if (changes.scripts) {
        console.log("Scripts updated:", changes.scripts.newValue);
    }
});

// Listen for page loads
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && isValidUrl(tab.url)) {
        chrome.storage.local.get("scripts", (result) => {
            const scripts = result.scripts || [];
            scripts.forEach((script) => {
                if (script.enabled && shouldInject(tab.url, script) && script.code) {
                    console.log(`Injecting script: ${script.name} into ${tab.url}`);
                    injectScript(tabId, script.code, script.autoTiming);
                }
            });
        });
    } else if (!isValidUrl(tab.url)) {
        console.warn("Tab URL is undefined or invalid for tab:", tabId, "URL:", tab.url);
    }
});

// Check if a URL is valid for injection
function isValidUrl(url) {
    return url && typeof url === "string" && (url.startsWith("http://") || url.startsWith("https://"));
}

// Determine if a script should be injected
function shouldInject(url, script) {
    // Validate script properties
    if (!script || typeof script !== "object") {
        console.error("Invalid script object:", script);
        return false;
    }

    if (!url || typeof url !== "string") {
        console.error("Invalid URL:", url);
        return false;
    }

    if (!script.matchType || !script.conditionKey) {
        console.error("Missing matchType or conditionKey in script:", script);
        return false;
    }

    // Match logic with error handling
    try {
        if (script.matchType === "equals" && url === script.conditionKey) {
            return true;
        }
        if (script.matchType === "contains" && url.includes(script.conditionKey)) {
            return true;
        }
        if (script.matchType === "regex") {
            const regex = new RegExp(script.conditionKey);
            return regex.test(url);
        }
    } catch (error) {
        console.error("Error in shouldInject:", error, script);
    }

    return false;
}

// Inject a script into a page
function injectScript(tabId, scriptCode, autoTiming) {
    chrome.scripting
        .executeScript({
            target: { tabId },
            world: "MAIN",
            func: (code) => eval(code), // Execute the script
            args: [scriptCode],
        })
        .then(() => {
            console.log(`Successfully injected script into tab ${tabId}`);
        })
        .catch((error) => console.error("Script injection failed:", error));
}
