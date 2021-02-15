/*
    Firefox addon "Language Switch"
    Copyright (C) 2021  Manuel Reimer <manuel.reimer@gmx.de>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

// Holds the current Accept-Language value
let gAcceptLanguage;

// Loads settings from storage
async function LoadSettings() {
  const prefs = await Storage.get();

  await SetCurrentValue(prefs.currentvalue, false);
}

// Converts language list (as given by user) to the correct format for the
// Accept-Language header (auto-generate quality values)
function LanguageStringToAcceptLanguage(aLangString) {
  const inputlist = aLangString.split(",");
  const outputlist = [];
  const digits = (inputlist.length > 10) ? 2 : 1;
  for (let index = 0; index < inputlist.length; index++) {
    if (index == 0)
      outputlist.push(inputlist[0]);
    else {
      const quality = (inputlist.length - index) / inputlist.length;
      outputlist.push(inputlist[index] + ";q=" + quality.toFixed(digits));
    }
  }
  return outputlist.join(",");
}

// Setter for the current language string
// Also stores the changed value
let _last_value = false;
async function SetCurrentValue(aValue, aStore = true) {
  if (aStore)
    Storage.set({currentvalue: aValue});

  // Sanitize value before using it
  aValue = aValue.replace(/[^a-zA-Z,-]/g, "");

  // If this is the last set value, then return
  if (aValue == _last_value)
    return;

  // Update status based on the given value
  gAcceptLanguage = LanguageStringToAcceptLanguage(aValue);
  await OverrideNavigatorLanguage(aValue);
  browser.browserAction.setBadgeText({text: aValue.substr(0, 2)});

  // Reload current tab if enabled in settings
  if (aStore) {
    const prefs = await Storage.get();
    const autoreload = prefs.autoreload || false;
    if (autoreload)
      browser.tabs.reload();
  }

  // Remember the currently handled value as the last set value
  _last_value = aValue;
}

// Register event listener to receive change requests from our popup
browser.runtime.onMessage.addListener((data, sender) => {
  if (data.type == "SetCurrentValue") {
    SetCurrentValue(data.value).then(() => {
      let languages = data.value.split(",").map(e => e.replace(/[^a-zA-Z-]/g, ""));
      // Once the "navigator" properties have been overwritten in a page, we
      // have to provide a value when updating. So get it from our window
      if (languages.length == 0 || languages[0] == "")
        languages = window.navigator.languages;
      browser.tabs.query({}).then(tabs => {
        for (let tab of tabs)
          browser.tabs.sendMessage(tab.id, {type: "languagechange",
                                            languages: languages});
      });
    })
  }
});

// This block injects our language override into "navigator.language"
let gContentScript = false;
async function OverrideNavigatorLanguage(aValue) {
  // Always unregister old content scripts first
  if (gContentScript) {
    gContentScript.unregister();
    gContentScript = false;
  }

  // Split language string and sanitize the values
  const languages = aValue.split(",").map(e => e.replace(/[^a-zA-Z-]/g, ""));

  // If a language is set, then override "navigator.language(s)".
  if (languages.length != 0 && languages[0] != "") {
    const script = "LANGUAGES = " + JSON.stringify(languages) + ";Setup();";
    gContentScript = await browser.contentScripts.register({
      "js": [{code: script}],
      "matches": ["<all_urls>"],
      "allFrames": true,
      "runAt": "document_start"
    });
  }
}

// Header rewrite handler. Rewrites "Accept-Language".
function RewriteAcceptLanguage(e) {
  if (gAcceptLanguage != "") {
    e.requestHeaders.forEach(function(header){
      if (header.name.toLowerCase() == "accept-language")
        header.value = gAcceptLanguage;
    });
  }
  return {requestHeaders: e.requestHeaders};
}

// Register header listener
browser.webRequest.onBeforeSendHeaders.addListener(
  RewriteAcceptLanguage,
  {urls: ["<all_urls>"]},
  ["blocking", "requestHeaders"]
);

// Set background color to a non-intrusive gray
browser.browserAction.setBadgeBackgroundColor({color: "#666666"});

// Load settings
LoadSettings();

IconUpdater.Init("icons/languageswitch.svg");
