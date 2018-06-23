/*
    Firefox addon "Language Switch"
    Copyright (C) 2018  Manuel Reimer <manuel.reimer@gmx.de>

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
let gCurrentValue;

// Loads settings from storage
// Also prepares a default set of menu entries if nothing is stored.
// They are only here as an example and to have some entries directly
// after installation.
// Please *NO* pull-requests to add your language here!
async function LoadSettings() {
  const prefs = await browser.storage.local.get();

  gCurrentValue = prefs.currentvalue || "";

  if (!prefs.menuentries) {
    const menuentries = [
      [browser.i18n.getMessage("menuentryDefault"),  ""],
      [browser.i18n.getMessage("menuentryEnglish"),  "en-us,en"],
      [browser.i18n.getMessage("menuentryFrench"),   "fr-fr,fr,en-us,en"],
      [browser.i18n.getMessage("menuentryGerman"),   "de-de,de,en-us,en"],
      [browser.i18n.getMessage("menuentryJapanese"), "ja,en-us,en"],
      [browser.i18n.getMessage("menuentrySpanish"),  "es-es,es,en-us,en"]
    ];
    await browser.storage.local.set({menuentries: menuentries});
  }
}

// Getter for the current language string
function GetCurrentValue() {
  return gCurrentValue;
}

// Setter for the current language string
// Also stores the changed value
function SetCurrentValue(aValue) {
  gCurrentValue = aValue;
  browser.storage.local.set({currentvalue: gCurrentValue});
}

// Header rewrite handler. Rewrites "Accept-Language".
function RewriteAcceptLanguage(e) {
  if (gCurrentValue != "") {
    e.requestHeaders.forEach(function(header){
      if (header.name.toLowerCase() == "accept-language")
        header.value = gCurrentValue;
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

// Load settings
LoadSettings();
