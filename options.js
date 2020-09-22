/*
    Firefox addon "Language Switch"
    Copyright (C) 2020  Manuel Reimer <manuel.reimer@gmx.de>

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

const gTemplate = document.getElementById("menuitem_template");
const gMenulist = document.getElementById("menulist");
const checkAutoReload = document.getElementById("autoreload_checkbox");
let gMenuentries;

async function Init() {
  [
    "menuentries_headline",
    "menuitem_label_label",
    "menuitem_value_label"
  ].forEach((id) => {
    document.getElementById(id).textContent = browser.i18n.getMessage(id);
  });

  document.getElementById("add_button").addEventListener("click", ListItemAddClicked);

  await loadOptions();
  checkAutoReload.addEventListener("change", CheckboxChanged);

  await UpdateMenuList();
}

async function StoreList() {
  await Storage.set({menuentries: gMenuentries});
  await browser.runtime.sendMessage({type: "OptionsChanged"});
}

// Syncs "gMenuentries" to the user interface
async function UpdateMenuList() {
  // Adjust list item count to current storage status
  const currentlen = gMenulist.children.length;
  const newlen = gMenuentries.length;
  if (newlen < currentlen) {
    while(gMenulist.children.length > newlen)
      gMenulist.removeChild(gMenulist.children[gMenulist.children.length - 1])
  }
  if (newlen > currentlen) {
    for (let index = gMenulist.children.length; index < newlen; index++) {
      const entry = gTemplate.cloneNode(true);
      entry.removeAttribute("id");
      entry.setAttribute("data-index", index);
      const textboxes = entry.getElementsByTagName("input");
      textboxes[0].addEventListener("input", TextboxChanged);
      textboxes[1].addEventListener("input", TextboxChanged);
      entry.getElementsByClassName("up_button")[0].addEventListener("click", ListItemUpClicked);
      entry.getElementsByClassName("down_button")[0].addEventListener("click", ListItemDownClicked);
      entry.getElementsByClassName("delete_button")[0].addEventListener("click", ListItemDeleteClicked);
      gMenulist.appendChild(entry);
    }
  }

  for (let index = 0; index < gMenuentries.length; index++) {
    const entry = gMenuentries[index];
    const menuitem = gMenulist.children[index];
    menuitem.getElementsByClassName("menuitem_label")[0].value = entry[0];
    menuitem.getElementsByClassName("menuitem_value")[0].value = entry[1];
  }
}

// Register event listener to receive option update notifications
browser.runtime.onMessage.addListener(async (data, sender) => {
  if (data.type == "OptionsChanged") {
    const prefs = await Storage.get();
    gMenuentries = prefs.menuentries || [];
    UpdateMenuList();
  }
});

// Reads the item index from a node (via event)
function EventToItemIndex(aEvent) {
  return parseInt(aEvent.target.parentNode.getAttribute("data-index"));
}

function TextboxChanged(aEvent) {
  const textbox = aEvent.target;
  const valueindex = parseInt(textbox.getAttribute("data-index"));
  const itemindex = EventToItemIndex(aEvent);
  gMenuentries[itemindex][valueindex] = textbox.value;
  StoreList();
}

function ListItemUpClicked(aEvent) {
  const itemindex = EventToItemIndex(aEvent);
  if (itemindex == 0)
    return;

  const tmp = gMenuentries[itemindex - 1];
  gMenuentries[itemindex - 1] = gMenuentries[itemindex];
  gMenuentries[itemindex] = tmp;
  UpdateMenuList();
  StoreList();
}

function ListItemDownClicked(aEvent) {
  const itemindex = EventToItemIndex(aEvent);
  if (itemindex == gMenuentries.length - 1)
    return;

  const tmp = gMenuentries[itemindex + 1];
  gMenuentries[itemindex + 1] = gMenuentries[itemindex];
  gMenuentries[itemindex] = tmp;
  UpdateMenuList();
  StoreList();
}

function ListItemAddClicked() {
  gMenuentries.push(["",""]);
  UpdateMenuList();
  StoreList();
}

function ListItemDeleteClicked(aEvent) {
  const itemindex = EventToItemIndex(aEvent);
  gMenuentries.splice(itemindex, 1);
  UpdateMenuList();
  StoreList();
}

async function CheckboxChanged(e) {
  if (e.target.id.match(/([a-z_]+)_checkbox/)) {
    let pref = RegExp.$1;
    let params = {};
    params[pref] = e.target.checked;
    await browser.storage.local.set(params);
  }
}

async function loadOptions() {
  const prefs = await Storage.get()
  checkAutoReload.checked = prefs.autoreload;
  gMenuentries = prefs.menuentries;
}

Init();
