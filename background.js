// Listen for updates to the script list
chrome.storage.onChanged.addListener((changes) => {
    if (changes.scripts) {
        console.log("Scripts updated:", changes.scripts.newValue);
    }
});

// Listen for page loads (ONLY inject automatic scripts)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && isValidUrl(tab.url)) {
        chrome.storage.local.get("scripts", (result) => {
            const scripts = result.scripts || [];
            scripts.forEach((script) => {
                if (script.enabled && script.trigger === "automatic" && shouldInject(tab.url, script) && script.code) {
                    console.log(`Injecting script: ${script.name} into ${tab.url}`);
                    injectScript(tabId, script.code, script.autoTiming);
                }
            });
        });
    }
});

// Check if a URL is valid for injection
function isValidUrl(url) {
    return url && typeof url === "string" && (url.startsWith("http://") || url.startsWith("https://"));
}

// Determine if a script should be injected
function shouldInject(url, script) {
    try {
        if (!script.conditionKey) return true;
        if (script.matchType === "equals" && url === script.conditionKey) return true;
        if (script.matchType === "contains" && url.includes(script.conditionKey)) return true;
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
    chrome.scripting.executeScript({
        target: { tabId },
        world: "MAIN",
        injectImmediately: autoTiming === "beforeLoad",
        func: (code) => eval(code),
        args: [scriptCode],
    }).then(() => {
        console.log(`Successfully injected script into tab ${tabId} with timing: ${autoTiming}`);
    }).catch((error) => console.error("Script injection failed:", error));
}

