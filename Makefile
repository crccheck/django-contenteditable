PROJECT=./example_project


test:
	python $(PROJECT)/manage.py test contenteditable_test


.PHONY: test
