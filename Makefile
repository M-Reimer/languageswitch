# -*- Mode: Makefile -*-
#
# Makefile for Language Switch
#

FILES = manifest.json \
        background.js \
        options.html \
        options.js \
        options.css \
        $(wildcard popup/choose_language.*) \
        $(wildcard _locales/*/messages.json) \
        $(wildcard icons/*.svg)

languageswitch-trunk.xpi: $(FILES) icons/languageswitch-light.svg
	@zip -9 - $^ > $@

icons/languageswitch-light.svg: icons/languageswitch.svg
	@sed 's/:#0c0c0d/:#f9f9fa/g' $^ > $@

clean:
	rm -f languageswitch-trunk.xpi
	rm -f icons/languageswitch-light.svg
