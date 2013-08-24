PROJECT=./example_project
DJ=python $(PROJECT)/manage.py


# delete generated files
clean:
	find -name "*.pyc" -delete
	find . -name ".DS_Store" -delete
	rm -rf .tox
	rm -rf MANIFEST
	rm -rf build
	rm -rf dist
	rm -rf *.egg-info


# run test suite
test:
	$(DJ) test


# reset an existing db
resetdb:
	$(DJ) sqlclear newspaper | $(DJ) dbshell
	$(DJ) sqlclear chunks | $(DJ) dbshell
	$(DJ) syncdb


# regenerate fixture based on current database
dumpdata:
	$(DJ) dumpdata newspaper chunks --indent=2 > $(PROJECT)/newspaper/fixtures/initial_data.json


static:
	cd contenteditable/static/contenteditable && make build

staticwatch:
	cd contenteditable/static/contenteditable && make watch


.PHONY: clean test resetdb dumpdata mediumjs static staticwatch
