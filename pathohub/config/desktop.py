from frappe import _

def get_data():
	return [
		{
			"module_name": "Pathohub",
			"color": "grey",
			"icon": "octicon octicon-file-directory",
			"type": "module",
			"label": _("Pathohub"),
			"items": [
				{
					"type": "page",
					"name": "franchisee",
					"label": _("Franchisee"),
					"description": _("Franchisee Dashboard"),
					"onboard_present": 1,
				}
			]
		}
	]
