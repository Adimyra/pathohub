import frappe

def get_lab_test_fields():
    meta = frappe.get_meta('Lab Test')
    fields = [df.fieldname for df in meta.fields]
    print(f"Fields in Lab Test: {fields}")

    if 'gender' in fields:
        print("Field 'gender' exists.")
    if 'sex' in fields:
        print("Field 'sex' exists.")

get_lab_test_fields()
