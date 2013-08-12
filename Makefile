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
	$(DJ) test contenteditable_test


# reset an existing db
resetdb:
	$(DJ) sqlclear newspaper | $(DJ) dbshell
	$(DJ) syncdb


.PHONY: clean test resetdb
