frappe.pages['path_pulse'].on_page_load = function (wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'PathPulse',
		single_column: true
	});

	// Hide the standard page header to mimic the full-screen design
	page.set_title('');
	$(wrapper).find('.page-head').hide();

	// Clear standard padding/margins
	$(wrapper).find('.layout-main-section').css({
		'padding': '0',
		'border': 'none'
	});

	const sidebar_html = `
	<div class="patho-container">
		<div class="patho-sidebar">
			<div class="sidebar-header">
				<div class="logo-icon">
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M10 2v7.31l-2.45 4.9A2 2 0 0 0 9.34 17h5.32a2 2 0 0 0 1.79-2.79L14 9.31V2h-4z"></path>
						<line x1="8.5" y1="2" x2="15.5" y2="2"></line>
					</svg>
				</div>
				<div class="logo-text">Patho<span>Node</span></div>
			</div>
			
			<div class="sidebar-workspace">
				<button class="workspace-btn">
					<span class="icon">
						${frappe.utils.icon('grid', 'sm')}
					</span>
					Dashboard
				</button>
			</div>

			<div class="sidebar-menu">
				<div class="menu-category">Front Desk</div>
				<div class="menu-item">
					<span class="icon">${frappe.utils.icon('users', 'sm')}</span>
					Registration
				</div>
				<div class="menu-item">
					<span class="icon">${frappe.utils.icon('file-text', 'sm')}</span>
					Billing / Order
				</div>

				<div class="menu-category">Clinical</div>
				<div class="menu-item">
					<span class="icon">${frappe.utils.icon('activity', 'sm')}</span>
					Collection
				</div>
				<div class="menu-item">
					<span class="icon">${frappe.utils.icon('truck', 'sm')}</span>
					Logistics
					<span class="badge">1</span>
				</div>

				<div class="menu-category">Admin</div>
				<div class="menu-item">
					<span class="icon">${frappe.utils.icon('box', 'sm')}</span>
					Inventory
					<span class="badge">1</span>
				</div>
				<div class="menu-item">
					<span class="icon">${frappe.utils.icon('credit-card', 'sm')}</span>
					Wallet
				</div>
				<div class="menu-item">
					<span class="icon">${frappe.utils.icon('file', 'sm')}</span>
					Reports
				</div>
			</div>
		</div>
		
		<div class="patho-content" style="flex: 1; padding: 40px;">
			<!-- Placeholder for main content -->
			
		</div>
	</div>
	`;

	$(wrapper).find('.layout-main-section').html(sidebar_html);
}