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

// Global list of language identifiers.
let LANGUAGES = [];

// Getters to be exported into page context
function GetLanguage() {
  return cloneInto(LANGUAGES[0], window.navigator);
}
function GetLanguages() {
  return cloneInto(LANGUAGES, window.navigator);
}

// Setup function which hooks the above getters into the corresponding
// window.navigator properties
let gIsSetup = false;
function Setup() {
  if (!gIsSetup) {
    Object.defineProperty(window.navigator.wrappedJSObject, 'language', {
      configurable: true,
      get: exportFunction(GetLanguage, window.navigator)
    });
    Object.defineProperty(window.navigator.wrappedJSObject, 'languages', {
      configurable: true,
      get: exportFunction(GetLanguages, window.navigator)
    });
    gIsSetup = true;
  }
}

// Register listener to receive language change events from background.js
browser.runtime.onMessage.addListener((data, sender) => {
  if (data.type == "languagechange") {
    LANGUAGES = data.languages;
    Setup();
    const e = new Event("languagechange", {bubbles: false, cancelable: false});
    window.dispatchEvent(e);
  }
});
