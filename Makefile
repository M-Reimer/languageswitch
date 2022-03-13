# -*- Mode: Makefile -*-
#
# Makefile for Language Switch
#

FILES = manifest.json \
        default-preferences.json \
        contentscript.js \
        background.js \
        utils/iconupdater.js \
        utils/storage.js \
        utils/html-i18n.js \
        options.html \
        options.js \
        options.css \
        $(wildcard popup/choose_language.*) \
        $(wildcard _locales/*/messages.json) \
        $(wildcard icons/*.svg)

ADDON = languageswitch

VERSION = $(shell sed -n  's/^  "version": "\([^"]\+\).*/\1/p' manifest.json)

WEBEXT_UTILS_REPO = git@github.com:M-Reimer/webext-utils.git

trunk: $(ADDON)-trunk.xpi

release: $(ADDON)-$(VERSION).xpi

%.xpi: $(FILES) icons/$(ADDON)-light.svg
	@zip -9 - $^ > $@

icons/$(ADDON)-light.svg: icons/$(ADDON).svg
	@sed 's/:#0c0c0d/:#f9f9fa/g' $^ > $@

clean:
	rm -f $(ADDON)-*.xpi
	rm -f icons/$(ADDON)-light.svg

# Starts local debug session
run: icons/$(ADDON)-light.svg
	web-ext run --bc -u "https://m-reimer.de/languageswitch/"

# Subtree stuff for webext-utils
# Note to myself. Initial setup of subtree:
# git subtree add --prefix utils git@github.com:M-Reimer/webext-utils.git master

subtree-pull:
	git subtree pull --prefix utils "$(WEBEXT_UTILS_REPO)" master

subtree-push:
	git subtree push --prefix utils "$(WEBEXT_UTILS_REPO)" master
