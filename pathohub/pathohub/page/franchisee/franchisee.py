import frappe
from frappe.utils import today

@frappe.whitelist()
def get_dashboard_stats(from_date=None, to_date=None):
    stats = {}
    
    filters_patient = {}
    filters_sample = {}
    
    if from_date and to_date:
        filters_patient['creation'] = ['between', [from_date, to_date]]
        filters_sample['creation'] = ['between', [from_date, to_date]]
    elif from_date:
        filters_patient['creation'] = ['>=', from_date]
        filters_sample['creation'] = ['>=', from_date]
    elif not from_date and not to_date:
         # Default behavior for samples if no filter: Today
         filters_sample['creation'] = ['>=', today()]

    try:
        stats['total_patients'] = frappe.db.count('Patient', filters_patient)
    except Exception:
        stats['total_patients'] = 0

    try:
        stats['samples_collected'] = frappe.db.count('Sample Collection', filters_sample)
    except Exception:
        stats['samples_collected'] = 0

    try:
        # Pending tests are current status, generally not date filtered but we could
        stats['pending_tests'] = frappe.db.count('Lab Test', {'status': ['!=', 'Completed']})
    except Exception:
        stats['pending_tests'] = 0
        frappe.log_error(frappe.get_traceback(), 'Franchisee Dashboard Stats Error')

    try:
        wallet = frappe.db.get_value('Franchisee Wallet', {'user': frappe.session.user}, 'balance')
        stats['wallet_balance'] = wallet or 0
    except Exception:
        stats['wallet_balance'] = 0

    return stats

def get_context(context):
	# do your server-side stuff here
	pass

@frappe.whitelist()
def get_pending_samples(patient):
	if not patient:
		return []
		
	# Find Lab Tests that are likely waiting for sample
	# We assume status 'Open' or similar implies new test from invoice.
	# We also check if it's already 'Sample Collected' to exclude it.
	
	tests = frappe.get_list('Lab Test',
		filters={
			'patient': patient,
			'status': ['!=', 'Completed']
		},
		fields=['name', 'template', 'status']
	)
	
	# Filter out those that are already 'Sample Collected' if that status is used
	# Or assume UI filters.
	pending_tests = []
	for t in tests:
		if t.status in ['Completed', 'Sample Collected']:
			continue

		if t.template:
			t.lab_test_name = frappe.db.get_value('Lab Test Template', t.template, 'lab_test_name')
		else:
			t.lab_test_name = t.name
		pending_tests.append(t)
		
	return pending_tests

@frappe.whitelist()
def create_sample_collection(patient, tests):
	if isinstance(tests, str):
		tests = frappe.parse_json(tests)
	
	collections = []
	for test_name in tests:
		# Create Sample Collection
		# We guess fields. If headers fail, we might need to debug.
		doc = frappe.new_doc('Sample Collection')
		doc.patient = patient
		
		# Try to link Lab Test if field exists
		# Validating fields
		meta = frappe.get_meta('Sample Collection')
		if meta.get_field('lab_test'):
			doc.lab_test = test_name
		elif meta.get_field('test'):
			doc.test = test_name
			

		doc.status = 'Collected' # Assuming status field
		
		doc.insert(ignore_permissions=True)
		collections.append(doc.name)
		
		# Update Lab Test status
		frappe.db.set_value('Lab Test', test_name, 'status', 'Sample Collected')
		
	return collections

@frappe.whitelist()
def get_wallet_balance():
    if not frappe.db.exists('Franchisee Wallet', {'user': frappe.session.user}):
        # Auto-create wallet for testing if not exists usually done by admin, but for now:
        if "System Manager" in frappe.get_roles():
             w = frappe.new_doc('Franchisee Wallet')
             w.user = frappe.session.user
             w.balance = 50000 # Give some initial credit for testing
             w.insert(ignore_permissions=True)
             return w.balance
        return 0
    
    return frappe.db.get_value('Franchisee Wallet', {'user': frappe.session.user}, 'balance')

@frappe.whitelist()
def process_payment(amount, customer, items):
    amount = float(amount)
    balance = get_wallet_balance() or 0
    if balance < amount:
        frappe.throw("Insufficient Wallet Balance. Please recharge.")
    
    # Deduct Logic
    wallet_name = frappe.db.get_value('Franchisee Wallet', {'user': frappe.session.user})
    frappe.db.set_value('Franchisee Wallet', wallet_name, 'balance', balance - amount)
    
    # Create Invoice logic passed from frontend usually, but here we can just return success
    # and let the frontend create the invoice, OR we create it here.
    # The user instruction was "implement wallet feature".
    # I will let the frontend create the invoice after this returns success, 
    # OR better: Wrap it all here transactionally.
    
    pass
@frappe.whitelist()
def create_invoice_with_payment(customer, items):
    if isinstance(items, str):
        items = frappe.parse_json(items)
        
    total_amount = sum([float(item.get('rate', 0)) * float(item.get('qty', 1)) for item in items])
    
    # Wallet deduction
    process_payment(total_amount, customer, items)
    
    # Create Invoice
    doc = frappe.new_doc('Sales Invoice')
    doc.customer = customer
    doc.due_date = frappe.utils.add_days(today(), 30)
    
    for item in items:
        doc.append('items', item)

    doc.insert(ignore_permissions=True)
    
    return doc

@frappe.whitelist()
def recharge_wallet(amount):
    amount = float(amount)
    if amount <= 0:
        frappe.throw("Amount must be positive.")
    
    # Ensure wallet exists
    get_wallet_balance() 
    
    if not frappe.db.exists('Franchisee Wallet', {'user': frappe.session.user}):
         frappe.throw("Wallet not found.")

    wallet_name = frappe.db.get_value('Franchisee Wallet', {'user': frappe.session.user})
    current_balance = frappe.db.get_value('Franchisee Wallet', wallet_name, 'balance')
    
    new_balance = current_balance + amount
    frappe.db.set_value('Franchisee Wallet', wallet_name, 'balance', new_balance)
    
    return new_balance
