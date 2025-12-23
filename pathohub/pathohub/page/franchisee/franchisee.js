frappe.pages['franchisee'].on_page_load = function (wrapper) {
    new FranchiseePage(wrapper);
}

function render_progress_bar(steps, current_step) {
    let html = '<div class="flex items-center justify-between relative mb-8 w-full max-w-2xl mx-auto">';

    // Background Line
    html += '<div class="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10 rounded"></div>';

    // Active Line portion (approximate width based on steps)
    let progress_percent = (current_step / (steps.length - 1)) * 100;
    html += `<div class="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-blue-500 -z-10 rounded transition-all duration-300" style="width: ${progress_percent}%"></div>`;

    steps.forEach((step, index) => {
        let is_completed = index < current_step;
        let is_active = index === current_step;

        let circle_class = is_completed ? 'bg-blue-500 text-white border-blue-500' :
            is_active ? 'bg-white text-blue-600 border-blue-500 ring-4 ring-blue-50' :
                'bg-white text-gray-400 border-gray-200';

        let text_class = is_active ? 'text-blue-600 font-bold' : 'text-gray-500 font-medium';

        html += `
            <div class="flex flex-col items-center relative group">
                <div class="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 ${circle_class} font-bold text-sm md:text-base transition-all duration-300 z-10">
                    ${is_completed ? frappe.utils.icon('check', 'xs') : (index + 1)}
                </div>
                <div class="absolute top-10 md:top-12 w-32 text-center">
                    <span class="text-xs md:text-sm ${text_class}">${step.title}</span>
                </div>
            </div>
        `;
    });

    html += '</div>';
    return html;
}

class FranchiseePage {
    constructor(wrapper) {
        this.wrapper = $(wrapper);
        this.page = frappe.ui.make_app_page({
            parent: wrapper,
            title: 'Franchisee'
        });

        // Inject Tailwind
        this.load_tailwind();

        this.components = {};
        this.setup_page_layout();
        this.setup_sidebar();
        this.setup_components();

        // Start with dashboard
        this.load_view({ id: 'dashboard' });
    }

    load_tailwind() {
        if (!document.getElementById('tailwind-script')) {
            let script = document.createElement('script');
            script.id = 'tailwind-script';
            script.src = "https://cdn.tailwindcss.com";
            document.head.appendChild(script);
        }
        this.inject_custom_css();
    }

    inject_custom_css() {
        if (!document.getElementById('soft-ui-forms')) {
            $(`<style id="soft-ui-forms">
                /* Soft UI Form Theme */
                
                /* Inputs */
                .frappe-control input.form-control, 
                .frappe-control select.form-control, 
                .frappe-control textarea.form-control {
                    background-color: #ffffff !important;
                    box-shadow: 0 4px 10px -1px rgba(0, 0, 0, 0.03), 0 2px 4px -1px rgba(0, 0, 0, 0.02) !important;
                    border: 1px solid #f3f4f6 !important;
                    border-radius: 0.75rem !important; /* rounded-xl */
                    padding: 0.65rem 1rem !important;
                    height: auto !important;
                    font-size: 0.95rem !important;
                    transition: all 0.2s ease;
                }

                .frappe-control input.form-control:focus, 
                .frappe-control select.form-control:focus, 
                .frappe-control textarea.form-control:focus {
                     box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important; /* blue-100 ring */
                     border-color: #3b82f6 !important;
                }

                /* Labels */
                .frappe-control .control-label {
                    color: #4b5563 !important; /* text-gray-600 */
                    font-weight: 600 !important;
                    font-size: 0.875rem !important;
                    margin-bottom: 0.5rem !important;
                    letter-spacing: 0.01em;
                }
                
                /* Checkbox adjustments */
                .frappe-control input[type="checkbox"] {
                     border-radius: 0.25rem;
                }

                /* Increase spacing between fields */
                .frappe-control {
                    margin-bottom: 1.5rem !important;
                }
            </style>`).appendTo(document.head);
        }
    }

    setup_page_layout() {
        // Hide standard headers/sidebar
        this.wrapper.find('.page-head').hide();
        this.wrapper.find('.layout-side-section').hide();

        this.wrapper.addClass('layout-inventory');
        this.wrapper.find('.layout-main-section').css({
            'max-width': '100%',
            'padding-left': '0',
            'padding-right': '0'
        });

        // Main Container using Tailwind
        this.$container = $('<div class="flex min-h-[calc(100vh-50px)] bg-gray-50 relative"></div>').appendTo(this.page.main);

        // Sidebar: Default expanded (w-64), collapsed (w-20). Mobile handling via absolute/z-index could be added but sticking to desktop-first with responsiveness
        this.sidebar_container = $(`
            <div class="bg-white border-r border-gray-200 flex-shrink-0 transition-all duration-300 ease-in-out z-20 w-64 relative group">
            </div>
        `).appendTo(this.$container);

        // Sidebar content wrapper for hiding text on collapse
        this.sidebar_content = $('<div class="h-full flex flex-col"></div>').appendTo(this.sidebar_container);

        this.main_content = $(`<div class="flex-1 p-6 overflow-y-auto w-full"></div>`).appendTo(this.$container);
    }

    setup_sidebar() {
        this.sidebar_content.addClass('flex flex-col h-full bg-white');

        // 1. Logo Section
        let logo_area = $(`
            <div class="h-20 flex items-center px-6 mb-2">
                <div class="flex items-center gap-3">
                    <div class="relative w-8 h-8">
                         <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="16" cy="16" r="14" fill="white" stroke="#3B82F6" stroke-width="2"/>
                            <path d="M16 8C11.5817 8 8 11.5817 8 16C8 20.4183 11.5817 24 16 24C20.4183 24 24 20.4183 24 16C24 11.5817 20.4183 8 16 8ZM16 20C13.7909 20 12 18.2091 12 16C12 13.7909 13.7909 12 16 12C18.2091 12 20 13.7909 20 16C20 18.2091 18.2091 20 16 20Z" fill="#3B82F6"/>
                        </svg>
                    </div>
                    <span class="text-xl font-bold text-gray-800 tracking-tight">PathoHub</span>
                </div>
            </div>
        `).appendTo(this.sidebar_content);



        // Scrollable Area for Menu
        let scroll_area = $('<div class="flex-1 overflow-y-auto px-6 space-y-8 no-scrollbar"></div>').appendTo(this.sidebar_content);

        // 3. Main Navigation
        this.sidebar_list = $('<ul class="flex flex-col space-y-1"></ul>').appendTo(scroll_area);

        let menu_items = [
            { "label": "Dashboard", "id": "dashboard", "icon": "pie-chart" },
            { "label": "Patients", "id": "patient_list", "icon": "users" },
            { "label": "Test Schedule", "id": "lab_test_list", "icon": "calendar" },
            { "label": "Sample Collection", "id": "sample_list", "icon": "edit" },
            { "label": "Patient Report", "id": "patient_report", "icon": "file-text" },
            { "label": "Create Invoice", "id": "billing", "icon": "credit-card" },
            { "label": "Inventory", "id": "inventory", "icon": "box" },
        ];

        menu_items.forEach(item => {
            let icon_html = frappe.utils.icon(item.icon, 'sm');
            let $li = $(`<li class="nav-item">
                 <a class="sidebar-link relative flex items-center justify-start w-full py-2.5 px-0 gap-3 text-gray-500 hover:text-gray-800 transition-colors duration-200 cursor-pointer group" href="#" data-id="${item.id}">
                     <div class="active-indicator absolute -left-6 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-lg opacity-0 transition-opacity"></div>
                     <span class="icon w-5 h-5 flex items-center justify-center flex-shrink-0 transition-colors">${icon_html}</span>
                     <span class="menu-label font-medium text-sm transition-colors">${item.label}</span>
                     ${item.id === 'patient_report' ? '<span class="ml-auto bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">5</span>' : ''}
                 </a>
             </li>`);

            $li.find('a').on('click', (e) => {
                e.preventDefault();
                this.load_view(item);
            });

            this.sidebar_list.append($li);
        });



        // 5. Bottom Section (Stats & Profile)
        let bottom_area = $(`
            <div class="p-6 mt-auto">
                <!-- Stats Card -->
                <div class="bg-gray-900 rounded-2xl p-4 mb-6 text-white relative overflow-hidden">
                    <div class="absolute -right-4 -top-4 w-24 h-24 bg-gray-800 rounded-full opacity-50"></div>
                     <div class="relative z-10">
                        <div class="text-sm font-medium text-gray-300 mb-1">Used space</div>
                        <div class="text-xs text-gray-400 mb-4 leading-relaxed">
                            Admin updated 09:12 am<br>November 08, 2020
                        </div>
                        <div class="flex items-end justify-between mb-2">
                             <span class="text-xs font-bold text-white">71%</span>
                        </div>
                        <div class="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                            <div class="h-full bg-white rounded-full" style="width: 71%"></div>
                        </div>
                     </div>
                </div>

                <!-- User Profile -->
                <div class="flex items-center justify-between group cursor-pointer">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                             <img src="https://ui-avatars.com/api/?name=${frappe.session.user_fullname}&background=random" class="w-full h-full object-cover">
                        </div>
                        <div class="flex flex-col">
                            <span class="text-sm font-bold text-gray-900 truncate max-w-[120px]">${frappe.session.user_fullname}</span>
                             <span class="text-xs text-gray-500 truncate max-w-[120px]">Franchisee Admin</span>
                        </div>
                    </div>
                     <button class="text-gray-400 hover:text-gray-600">
                        ${frappe.utils.icon('more-vertical', 'sm')}
                    </button>
                </div>
            </div>
        `).appendTo(this.sidebar_content);

    }

    setup_components() {
        this.components.dashboard = new DashboardComponent(this);
        this.components.patient_list = new PatientListComponent(this);
        this.components.patient = new PatientRegistrationComponent(this);
        this.components.billing = new BillingFormComponent(this);
        this.components.sample_list = new SampleCollectionListComponent(this);
        this.components.sample = new SampleCollectionComponent(this);
        this.components.patient_report = new PatientReportComponent(this);
        this.components.result_entry = new LabTestResultEntryComponent(this);
        this.components.lab_test_list = new LabTestListComponent(this);
        this.components.lab_test = new LabTestFormComponent(this);
        this.components.inventory = new InventoryComponent(this);
    }

    load_view(item) {
        // Update active sidebar link
        // Reset all links
        this.sidebar_list.find('.sidebar-link').removeClass('active text-gray-900').addClass('text-gray-500 hover:text-gray-800');
        this.sidebar_list.find('.active-indicator').removeClass('opacity-100').addClass('opacity-0');
        this.sidebar_list.find('.icon').removeClass('text-blue-600');

        // Activate current link
        let active_link = this.sidebar_list.find(`a[data-id="${item.id}"]`);
        active_link.removeClass('text-gray-500 hover:text-gray-800').addClass('active text-gray-900');
        active_link.find('.active-indicator').removeClass('opacity-0').addClass('opacity-100');
        active_link.find('.icon').addClass('text-blue-600');

        this.main_content.empty();

        if (item.id === 'dashboard') {
            this.components.dashboard.render(this.main_content);
        } else if (item.id === 'patient_list') {
            this.components.patient_list.render(this.main_content);
        } else if (item.id === 'patient') {
            this.components.patient.render(this.main_content);
        } else if (item.id === 'billing') {
            this.components.billing.render(this.main_content);
        } else if (item.id === 'sample_list') {
            this.components.sample_list.render(this.main_content);
        } else if (item.id === 'sample') {
            this.components.sample.render(this.main_content);
        } else if (item.id === 'patient_report') {
            this.components.patient_report.render(this.main_content);
        } else if (item.id === 'result_entry') {
            this.components.result_entry.render(this.main_content, item);
        } else if (item.id === 'lab_test_list') {
            this.components.lab_test_list.render(this.main_content);
        } else if (item.id === 'lab_test') {
            this.components.lab_test.render(this.main_content);
        } else if (item.id === 'inventory') {
            this.components.inventory.render(this.main_content);
        } else {
            this.main_content.html(`<h3>Error</h3><p>View not found.</p>`);
        }
    }
}

class InventoryComponent {
    constructor(page_manager) {
        this.page_manager = page_manager;
    }

    render(container) {
        let wrapper = $('<div class="max-w-7xl mx-auto"></div>').appendTo(container);
        $('<div class="mb-6"><h3 class="text-2xl font-bold text-gray-800">Inventory Management</h3></div>').appendTo(wrapper);

        let layout = $(`
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div class="flex border-b border-gray-100">
                    <button class="px-6 py-4 font-medium text-blue-600 border-b-2 border-blue-600 transition-colors focus:outline-none" data-tab="stock">My Stock</button>
                    <button class="px-6 py-4 font-medium text-gray-500 hover:text-gray-700 transition-colors focus:outline-none" data-tab="requests">Material Requests</button>
                </div>
                <div class="p-6">
                    <div id="stock-view">
                        <div class="flex justify-between items-center mb-4">
                            <h4 class="text-lg font-bold text-gray-800">My Stock</h4>
                            <!-- You could add stock Actions here if needed -->
                        </div>
                        <div id="stock-list" class="space-y-3"></div>
                    </div>
                    <div id="requests-view" class="hidden">
                        <div class="flex justify-between items-center mb-4">
                            <h4 class="text-lg font-bold text-gray-800">Material Requests</h4>
                            <button id="new-request-btn" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium">New Request</button>
                        </div>
                        <div id="request-list"></div>
                    </div>
                </div>
            </div>
        `).appendTo(wrapper);

        // Tab Switching Logic
        layout.find('[data-tab]').on('click', (e) => {
            let tab = $(e.currentTarget).data('tab');

            // Update Tab styles
            layout.find('[data-tab]').removeClass('text-blue-600 border-b-2 border-blue-600').addClass('text-gray-500 hover:text-gray-700');
            $(e.currentTarget).removeClass('text-gray-500 hover:text-gray-700').addClass('text-blue-600 border-b-2 border-blue-600');

            // Toggle Views
            if (tab === 'stock') {
                layout.find('#stock-view').removeClass('hidden');
                layout.find('#requests-view').addClass('hidden');
            } else {
                layout.find('#stock-view').addClass('hidden');
                layout.find('#requests-view').removeClass('hidden');
            }
        });

        this.stock_list_area = layout.find('#stock-list');
        this.request_list_area = layout.find('#request-list');

        layout.find('#new-request-btn').on('click', () => {
            new MaterialRequestFormComponent(() => this.load_requests());
        });

        this.load_stock();
        this.load_requests();
    }

    load_stock() {
        this.stock_list_area.html('<p class="text-gray-500">Loading stock...</p>');
        frappe.call({
            method: 'pathohub.pathohub.page.franchisee.franchisee.get_stock_list',
            callback: (r) => {
                this.stock_list_area.empty();
                if (r.message && r.message.length > 0) {
                    let table = $(`
                        <div class="overflow-x-auto rounded-lg border border-gray-200">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Code</th>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                                    <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200"></tbody>
                        </table>
                        </div>
                    `).appendTo(this.stock_list_area);

                    r.message.forEach(item => {
                        $(`
                            <tr class="hover:bg-gray-50">
                                <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800">${item.item_code}</td>
                                <td class="px-4 py-3 text-sm text-gray-600">${item.item_name || '-'}</td>
                                <td class="px-4 py-3 whitespace-nowrap text-sm font-bold text-blue-600 text-right">${item.qty}</td>
                            </tr>
                        `).appendTo(table.find('tbody'));
                    });
                } else {
                    this.stock_list_area.html('<div class="text-center p-4 bg-gray-50 rounded-lg text-gray-500">No stock available.</div>');
                }
            }
        });
    }

    load_requests() {
        this.request_list_area.html('<p class="text-gray-500">Loading requests...</p>');
        frappe.call({
            method: 'pathohub.pathohub.page.franchisee.franchisee.get_material_requests',
            callback: (r) => {
                this.request_list_area.empty();
                if (r.message && r.message.length > 0) {
                    let table = $(`
                        <div class="overflow-x-auto rounded-lg border border-gray-200">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ordered</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200"></tbody>
                        </table>
                        </div>
                    `).appendTo(this.request_list_area);

                    r.message.forEach(req => {
                        $(`
                            <tr class="hover:bg-gray-50">
                                <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800">${req.name}</td>
                                <td class="px-4 py-3 text-sm text-gray-600">
                                    <div class="max-w-[200px] truncate" title="${req.item_names || ''}">${req.item_names || '-'}</div>
                                </td>
                                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">${req.status}</td>
                                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">${frappe.datetime.str_to_user(req.schedule_date)}</td>
                                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">${req.per_ordered}%</td>
                            </tr>
                        `).appendTo(table.find('tbody'));
                    });
                } else {
                    this.request_list_area.html('<div class="text-center p-4 bg-gray-50 rounded-lg text-gray-500">No material requests found.</div>');
                }
            }
        });
    }
}

class MaterialRequestFormComponent {
    constructor(on_success) {
        this.on_success = on_success;
        this.items = [];
        this.make_dialog();
    }

    make_dialog() {
        this.dialog = new frappe.ui.Dialog({
            title: 'New Material Request',
            fields: [
                { fieldname: 'schedule_date', label: 'Required By Date', fieldtype: 'Date', reqd: 1, default: frappe.datetime.add_days(frappe.datetime.nowdate(), 7) },
                { fieldname: 'warehouse', label: 'Target Warehouse', fieldtype: 'Link', options: 'Warehouse', reqd: 1 },
                { fieldname: 'items_html', fieldtype: 'HTML' }
            ],
            primary_action_label: 'Submit Request',
            primary_action: (values) => {
                if (this.items.length === 0) {
                    frappe.msgprint("Please add at least one item.");
                    return;
                }

                frappe.call({
                    method: 'pathohub.pathohub.page.franchisee.franchisee.create_material_request',
                    args: {
                        items: this.items,
                        schedule_date: values.schedule_date,
                        warehouse: values.warehouse
                    },
                    callback: (r) => {
                        if (!r.exc) {
                            frappe.show_alert({ message: `Material Request ${r.message} created.`, indicator: "green" });
                            this.dialog.hide();
                            if (this.on_success) this.on_success();
                        }
                    }
                })
            }
        });

        this.items_wrapper = $(this.dialog.get_field('items_html').wrapper);
        this.render_items_table();

        this.dialog.show();
    }

    render_items_table() {
        this.items_wrapper.empty();
        let table = $(`
            <div class="mb-4">
                <table class="w-full text-sm">
                    <thead>
                        <tr class="border-b">
                            <th class="p-2 text-left font-medium text-gray-600">Item</th>
                            <th class="p-2 text-left font-medium text-gray-600">Quantity</th>
                            <th class="w-10"></th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        `).appendTo(this.items_wrapper);

        this.items.forEach((item, index) => {
            let row = $(`
                <tr class="border-b">
                    <td class="p-2">
                        <div>${item.item_code}</div>
                        <div class="text-xs text-gray-500">${item.item_name || ''}</div>
                    </td>
                    <td class="p-2">${item.qty}</td>
                    <td class="p-2 text-center">
                        <button class="text-red-500 hover:text-red-700" data-index="${index}">
                            ${frappe.utils.icon('delete', 'sm')}
                        </button>
                    </td>
                </tr>
            `).appendTo(table.find('tbody'));

            row.find('button').on('click', (e) => {
                let idx = $(e.currentTarget).data('index');
                this.items.splice(idx, 1);
                this.render_items_table();
            });
        });

        // Add item form
        let add_form = $('<div class="grid grid-cols-12 gap-4 mt-4 bg-gray-50 p-3 rounded-lg border border-gray-100"></div>').appendTo(this.items_wrapper);

        let item_wrapper = $('<div class="col-span-7"></div>').appendTo(add_form);
        $('<label class="block text-xs text-gray-500 mb-1">Item</label>').appendTo(item_wrapper);
        let item_control_dict = {
            df: { fieldtype: 'Link', options: 'Item', placeholder: 'Select Item', only_select: true },
            parent: item_wrapper,
            render_input: true
        };
        let item_control = frappe.ui.form.make_control(item_control_dict);
        item_control.$wrapper.css('margin-bottom', '0');

        let qty_wrapper = $('<div class="col-span-3"></div>').appendTo(add_form);
        $('<label class="block text-xs text-gray-500 mb-1">Quantity</label>').appendTo(qty_wrapper);
        let qty_input = $('<input type="number" class="form-control" placeholder="0">').appendTo(qty_wrapper);

        let btn_wrapper = $('<div class="col-span-2"></div>').appendTo(add_form);
        $('<label class="block text-xs text-transparent select-none mb-1">&nbsp;</label>').appendTo(btn_wrapper);
        let add_btn = $('<button class="btn btn-primary w-full">Add</button>').appendTo(btn_wrapper);

        add_btn.on('click', () => {
            let item_code = item_control.get_value();
            let qty = qty_input.val();
            if (item_code && qty > 0) {
                frappe.db.get_value('Item', item_code, 'item_name').then(r => {
                    let item_name = r.message.item_name;
                    this.items.push({ item_code, item_name, qty });
                    this.render_items_table();
                });
            } else {
                frappe.msgprint("Please select an item and enter a valid quantity.");
            }
        });
    }
}

class DashboardComponent {
    constructor(page_manager) {
        this.page_manager = page_manager;
    }

    render(container) {
        $('<div class="mb-6"><h3 class="text-2xl font-bold text-gray-800">Franchisee Dashboard</h3><p class="text-gray-500">Welcome back, here is what’s happening today.</p></div>').appendTo(container);

        let stats_area = $(`
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <!-- Total Patients -->
                <div class="relative bg-white rounded-3xl p-6 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 group">
                    <div class="absolute right-0 top-0 h-full w-2 bg-blue-500 rounded-l-lg"></div>
                    <div class="relative z-10 flex flex-col h-full justify-between">
                        <div class="flex items-start justify-between mb-4">
                            <div class="p-3 bg-blue-50 rounded-2xl text-blue-600 group-hover:scale-110 transition-transform duration-300">
                                ${frappe.utils.icon('users', 'md')}
                            </div>
                            <div class="flex items-center space-x-1">
                                <span class="text-xs font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-full">+12%</span>
                            </div>
                        </div>
                        <div>
                            <h2 class="text-4xl font-extrabold text-gray-800 tracking-tight" id="total_patients_card">...</h2>
                            <p class="text-sm font-medium text-gray-400 mt-1">Total Patients</p>
                        </div>
                    </div>
                </div>

                <!-- Samples Collected -->
                <div class="relative bg-white rounded-3xl p-6 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 group">
                    <div class="absolute right-0 top-0 h-full w-2 bg-purple-500 rounded-l-lg"></div>
                    <div class="relative z-10 flex flex-col h-full justify-between">
                        <div class="flex items-start justify-between mb-4">
                            <div class="p-3 bg-purple-50 rounded-2xl text-purple-600 group-hover:scale-110 transition-transform duration-300">
                                ${frappe.utils.icon('edit', 'md')}
                            </div>
                            <div class="flex items-center space-x-1">
                                <span class="text-xs font-bold text-purple-500 bg-purple-50 px-2 py-1 rounded-full">+5%</span>
                            </div>
                        </div>
                        <div>
                            <h2 class="text-4xl font-extrabold text-gray-800 tracking-tight" id="samples_collected_card">...</h2>
                            <p class="text-sm font-medium text-gray-400 mt-1">Samples Collected</p>
                        </div>
                    </div>
                </div>

                <!-- Pending Tests -->
                <div class="relative bg-white rounded-3xl p-6 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 group">
                     <div class="absolute right-0 top-0 h-full w-2 bg-yellow-500 rounded-l-lg"></div>
                    <div class="relative z-10 flex flex-col h-full justify-between">
                        <div class="flex items-start justify-between mb-4">
                            <div class="p-3 bg-yellow-50 rounded-2xl text-yellow-600 group-hover:scale-110 transition-transform duration-300">
                                ${frappe.utils.icon('calendar', 'md')}
                            </div>
                             <div class="flex items-center space-x-1">
                                <span class="text-xs font-bold text-yellow-500 bg-yellow-50 px-2 py-1 rounded-full">Active</span>
                            </div>
                        </div>
                        <div>
                            <h2 class="text-4xl font-extrabold text-gray-800 tracking-tight" id="pending_tests_card">...</h2>
                            <p class="text-sm font-medium text-gray-400 mt-1">Pending Tests</p>
                        </div>
                    </div>
                </div>

                <!-- Total Revenue / Wallet -->
                <div class="relative bg-white rounded-3xl p-6 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 group">
                    <div class="absolute right-0 top-0 h-full w-2 bg-emerald-500 rounded-l-lg"></div>
                    <div class="relative z-10 flex flex-col h-full justify-between">
                        <div class="flex items-start justify-between mb-4">
                            <div class="p-3 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:scale-110 transition-transform duration-300">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-indian-rupee"><path d="M6 3h12"/><path d="M6 8h12"/><path d="M6 13l8.5 10"/><path d="M6 13h3"/><path d="M9 13c6.667 0 6.667-10 0-10"/></svg>
                            </div>
                             <button class="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full hover:bg-emerald-100 transition-colors" id="add-funds-btn">
                                Add Funds
                            </button>
                        </div>
                        <div>
                             <h2 class="text-3xl font-extrabold text-gray-800 tracking-tight" id="wallet_balance_val">...</h2>
                             <p class="text-sm font-medium text-gray-400 mt-1">Wallet Balance</p>
                             <div class="mt-2 text-xs text-gray-400">Total Rev: <span id="total_revenue_card" class="font-semibold text-gray-600">...</span></div>
                        </div>
                    </div>
                </div>
            </div>
        `).appendTo(container);

        // Use hidden class for layout inventory check placeholder or remove it? Kept simple.

        let load_stats = () => {
            // No filter arguments to fetch all-time data
            let args = {};
            frappe.call({
                method: 'pathohub.pathohub.page.franchisee.franchisee.get_dashboard_stats',
                args: args,
                callback: (r) => {
                    if (r.message) {
                        $('#total_patients_card').text(r.message.total_patients);
                        $('#samples_collected_card').text(r.message.samples_collected);
                        $('#pending_tests_card').text(r.message.pending_tests);
                        let revenue_fmt = frappe.format(r.message.total_revenue, { fieldtype: 'Currency' });
                        $('#total_revenue_card').html(revenue_fmt.replace(/\.00(?=[^0-9]|$|<)/g, ''));

                        let balance_fmt = frappe.format(r.message.wallet_balance, { fieldtype: 'Currency' });
                        $('#wallet_balance_val').html(balance_fmt.replace(/\.00(?=[^0-9]|$|<)/g, ''));
                    }
                }
            });
        };

        stats_area.on('click', '#add-funds-btn', (e) => {
            e.stopPropagation();
            frappe.prompt([
                { label: 'Amount to Add', fieldname: 'amount', fieldtype: 'Currency', reqd: 1 }
            ], (values) => {
                frappe.call({
                    method: 'pathohub.pathohub.page.franchisee.franchisee.recharge_wallet',
                    args: { amount: values.amount },
                    callback: (r) => {
                        if (!r.exc) {
                            frappe.show_alert({ message: 'Wallet Recharged Successfully', indicator: 'green' });
                            let balance_fmt = frappe.format(r.message, { fieldtype: 'Currency' });
                            $('#wallet_balance_val').html(balance_fmt.replace(/\.00(?=[^0-9]|$|<)/g, ''));
                            // Refresh stats to likely update view if needed
                            load_stats();
                        }
                    }
                });
            }, 'Add Funds to Wallet', 'Recharge');
        });

        load_stats();
    }
}

class PatientListComponent {
    constructor(page_manager) {
        this.page_manager = page_manager;
        this.start = 0;
        this.page_length = 10;
        this.total_count = 0;
        this.current_search = '';
        this.filters = { name: '', mobile: '', gender: '', date: '' };
        this.current_tab = 'patients';
    }

    render(container) {
        let wrapper = $('<div class="max-w-7xl mx-auto"></div>').appendTo(container);

        // Header
        let header = $('<div class="flex justify-between items-center mb-6"></div>').appendTo(wrapper);
        $('<h3 class="text-2xl font-bold text-gray-800">Patient Management</h3>').appendTo(header);
        let action_btn = $('<button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium flex items-center gap-2"></button>').appendTo(header);
        $(`<span>${frappe.utils.icon('plus', 'sm')}</span><span>Register Patient</span>`).appendTo(action_btn);

        action_btn.on('click', () => {
            this.page_manager.load_view({ id: 'patient' });
        });

        // Tabs
        let tab_nav = $('<div class="flex border-b border-gray-200 mb-6"></div>').appendTo(wrapper);
        let tabs = [
            { id: 'patients', label: 'Patients' },
            { id: 'reports', label: 'Patient Reports' },
            { id: 'invoices', label: 'Invoices' }
        ];

        tabs.forEach(tab => {
            let active_class = this.current_tab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700';
            let btn = $(`<button class="px-6 py-3 font-medium text-sm transition-colors border-b-2 ${active_class}" data-tab="${tab.id}">${tab.label}</button>`)
                .appendTo(tab_nav);

            btn.on('click', () => {
                this.current_tab = tab.id;
                // Update UI
                tab_nav.find('button').removeClass('border-blue-600 text-blue-600').addClass('border-transparent text-gray-500 hover:text-gray-700');
                btn.removeClass('border-transparent text-gray-500 hover:text-gray-700').addClass('border-blue-600 text-blue-600');
                this.render_content(this.content_area);
            });
        });

        this.content_area = $('<div></div>').appendTo(wrapper);
        this.render_content(this.content_area);
    }

    render_content(container) {
        container.empty();
        if (this.current_tab === 'patients') {
            this.render_patient_tab(container);
        } else if (this.current_tab === 'reports') {
            this.render_report_tab(container);
        } else if (this.current_tab === 'invoices') {
            this.render_invoice_tab(container);
        }
    }

    render_patient_tab(container) {




        // List Area
        this.list_area = $('<div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"></div>').appendTo(container);
        this.table_container = $('<div></div>').appendTo(this.list_area);

        // Static Table Structure with Filters
        let table = $(`
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient Name</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered On</th>
                    </tr>
                    <tr class="bg-gray-50 filter-row">
                        <td class="px-6 py-2"><input type="text" data-filter="name" class="form-control text-xs h-8" placeholder="Filter Name" value="${this.filters.name || ''}"></td>
                        <td class="px-6 py-2"><input type="text" data-filter="mobile" class="form-control text-xs h-8" placeholder="Filter Mobile" value="${this.filters.mobile || ''}"></td>
                        <td class="px-6 py-2">
                             <select data-filter="gender" class="form-control text-xs h-8">
                                <option value="" ${this.filters.gender === '' ? 'selected' : ''}>All</option>
                                <option value="Male" ${this.filters.gender === 'Male' ? 'selected' : ''}>Male</option>
                                <option value="Female" ${this.filters.gender === 'Female' ? 'selected' : ''}>Female</option>
                                <option value="Other" ${this.filters.gender === 'Other' ? 'selected' : ''}>Other</option>
                            </select>
                        </td>
                        <td class="px-6 py-2">
                            <div class="flex items-center gap-1">
                                <input type="date" data-filter="date" class="form-control text-xs h-8" value="${this.filters.date || ''}">
                                <button class="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded transition-colors" id="reset-filters" title="Reset Filters">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-refresh-cw"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                                </button>
                            </div>
                        </td>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200" id="patient-list-body"></tbody>
            </table>
        `).appendTo(this.table_container);

        // Bind Filter Events for Column Filters
        let col_debounce;
        table.find('input, select').on('input change', (e) => {
            clearTimeout(col_debounce);
            let input = $(e.currentTarget);
            let field = input.data('filter');
            let value = input.val();

            col_debounce = setTimeout(() => {
                this.filters[field] = value;
                this.start = 0;
                this.fetch_patients();
            }, 300);
        });

        table.find('#reset-filters').on('click', () => {
            this.filters = { name: '', mobile: '', gender: '', date: '' };
            table.find('input').val('');
            table.find('select').val('');
            this.start = 0;
            this.fetch_patients();
        });

        // Pagination Footer
        this.footer = $(`
            <div class="bg-gray-50 border-t border-gray-200 px-6 py-3 flex items-center justify-between">
                <div class="flex items-center gap-2 text-sm text-gray-600">
                    <span>Rows per page:</span>
                    <select class="form-control h-8 w-16 text-xs p-1 bg-white border-gray-300 rounded" id="rows-per-page">
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                    </select>
                </div>
                <div class="flex items-center gap-4 text-sm text-gray-600">
                    <span id="page-info">Showing 0-0 of 0</span>
                    <div class="flex gap-1">
                        <button class="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed" id="prev-btn" disabled>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-chevron-left"><polyline points="15 18 9 12 15 6"></polyline></svg>
                        </button>
                        <button class="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed" id="next-btn" disabled>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-chevron-right"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </button>
                    </div>
                </div>
            </div>
        `).appendTo(this.list_area);

        // Footer Events
        this.footer.find('#rows-per-page').on('change', (e) => {
            this.page_length = parseInt($(e.currentTarget).val());
            this.start = 0;
            this.fetch_patients();
        });

        this.footer.find('#prev-btn').on('click', () => {
            if (this.start > 0) {
                this.start -= this.page_length;
                this.fetch_patients();
            }
        });

        this.footer.find('#next-btn').on('click', () => {
            if (this.start + this.page_length < this.total_count) {
                this.start += this.page_length;
                this.fetch_patients();
            }
        });

        this.fetch_patients();
    }

    render_report_tab(container) {
        container.html('<p class="text-gray-500 text-center py-8">Loading Reports...</p>');
        frappe.call({
            method: 'frappe.client.get_list',
            args: {
                doctype: 'Lab Test',
                filters: { docstatus: 1 },
                fields: ['name', 'patient_name', 'lab_test_name', 'status', 'creation'],
                order_by: 'creation desc',
                limit: 50
            },
            callback: (r) => {
                container.empty();
                if (r.message && r.message.length > 0) {
                    let table = $(`
                        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <table class="min-w-full divide-y divide-gray-200">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody class="bg-white divide-y divide-gray-200"></tbody>
                            </table>
                        </div>
                    `).appendTo(container);

                    r.message.forEach(item => {
                        $(`
                            <tr class="hover:bg-gray-50">
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${frappe.datetime.str_to_user(item.creation)}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${item.patient_name}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.lab_test_name}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.status}</td>
                            </tr>
                        `).appendTo(table.find('tbody'));
                    });
                } else {
                    container.html('<div class="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center text-gray-500">No reports found.</div>');
                }
            }
        });
    }

    render_invoice_tab(container) {
        container.html('<p class="text-gray-500 text-center py-8">Loading Invoices...</p>');
        frappe.call({
            method: 'frappe.client.get_list',
            args: {
                doctype: 'Sales Invoice',
                fields: ['name', 'customer_name', 'grand_total', 'status', 'posting_date'],
                order_by: 'posting_date desc',
                limit: 50
            },
            callback: (r) => {
                container.empty();
                if (r.message && r.message.length > 0) {
                    let table = $(`
                        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <table class="min-w-full divide-y divide-gray-200">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody class="bg-white divide-y divide-gray-200"></tbody>
                            </table>
                        </div>
                    `).appendTo(container);

                    r.message.forEach(item => {
                        $(`
                            <tr class="hover:bg-gray-50">
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${frappe.datetime.str_to_user(item.posting_date)}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${item.customer_name}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">${frappe.format(item.grand_total, { fieldtype: 'Currency' })}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.status}</td>
                            </tr>
                        `).appendTo(table.find('tbody'));
                    });
                } else {
                    container.html('<div class="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center text-gray-500">No invoices found.</div>');
                }
            }
        });
    }

    fetch_patients() {
        let filters = [];
        if (this.filters.name) {
            filters.push(['Patient', 'first_name', 'like', `%${this.filters.name}%`]);
        }
        if (this.filters.mobile) {
            filters.push(['Patient', 'mobile', 'like', `%${this.filters.mobile}%`]);
        }
        if (this.filters.gender) {
            filters.push(['Patient', 'sex', '=', this.filters.gender]);
        }
        if (this.filters.date) {
            filters.push(['Patient', 'creation', 'between', [this.filters.date + ' 00:00:00', this.filters.date + ' 23:59:59']]);
        }

        // 1. Get Count
        frappe.call({
            method: 'frappe.client.get_list',
            args: {
                doctype: 'Patient',
                filters: filters,
                fields: ['name'],
                limit: 999999
            },
            callback: (r_count) => {
                this.total_count = r_count.message ? r_count.message.length : 0;

                // 2. Get Data Page
                frappe.call({
                    method: 'frappe.client.get_list',
                    args: {
                        doctype: 'Patient',
                        fields: ['name', 'first_name', 'last_name', 'mobile', 'email', 'sex', 'creation'],
                        order_by: 'creation desc',
                        limit_start: this.start,
                        limit_page_length: this.page_length,
                        filters: filters
                    },
                    callback: (r) => {
                        this.render_list(r.message || []);
                        this.update_pagination_ui();
                    }
                });
            }
        });
    }

    update_pagination_ui() {
        let end = Math.min(this.start + this.page_length, this.total_count);
        let start_disp = this.total_count > 0 ? this.start + 1 : 0;

        this.footer.find('#page-info').text(`Showing ${start_disp}-${end} of ${this.total_count}`);

        let prev_btn = this.footer.find('#prev-btn');
        let next_btn = this.footer.find('#next-btn');

        // Toggle disabled state
        prev_btn.prop('disabled', this.start <= 0);
        next_btn.prop('disabled', end >= this.total_count);

        // Toggle styling classes
        if (this.start <= 0) {
            prev_btn.addClass('opacity-50 cursor-not-allowed').removeClass('hover:bg-gray-200');
        } else {
            prev_btn.removeClass('opacity-50 cursor-not-allowed').addClass('hover:bg-gray-200');
        }

        if (end >= this.total_count) {
            next_btn.addClass('opacity-50 cursor-not-allowed').removeClass('hover:bg-gray-200');
        } else {
            next_btn.removeClass('opacity-50 cursor-not-allowed').addClass('hover:bg-gray-200');
        }
    }

    render_list(patients) {
        let tbody = this.table_container.find('tbody');
        tbody.empty();

        if (patients.length === 0) {
            tbody.html('<tr><td colspan="4" class="p-8 text-center text-gray-500">No patients found.</td></tr>');
            return;
        }

        patients.forEach(p => {
            let full_name = `${p.first_name} ${p.last_name || ''}`;
            let row = $(`
                <tr class="hover:bg-gray-50 transition-colors cursor-pointer" title="Click to view details">
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900">${full_name}</div>
                        <div class="text-xs text-gray-500">${p.name}</div>
                    </td>
                     <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">${p.mobile}</div>
                        <div class="text-xs text-gray-500">${p.email || '-'}</div>
                    </td>
                     <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${p.sex}</td>
                     <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${frappe.datetime.str_to_user(p.creation).split(' ')[0]}</td>
                </tr>
            `).appendTo(tbody);

            row.on('click', () => {
                this.show_patient_details(p.name);
            });
        });
    }

    show_patient_details(patient_name) {
        frappe.call({
            method: 'frappe.client.get',
            args: {
                doctype: 'Patient',
                name: patient_name
            },
            callback: (r) => {
                if (r.message) {
                    let p = r.message;
                    let full_name = `${p.first_name} ${p.last_name || ''}`;

                    let d = new frappe.ui.Dialog({
                        title: full_name,
                        start_html: `<div class="p-4">`,
                        fields: [
                            { fieldtype: 'HTML', fieldname: 'details_html' }
                        ],
                    });

                    let details_html = `
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                            <div>
                                <label class="text-xs text-gray-500 uppercase font-bold tracking-wide">Contact</label>
                                <div class="text-gray-900 font-medium">${p.mobile}</div>
                                <div class="text-sm text-gray-600">${p.email || '-'}</div>
                            </div>
                            <div>
                                <label class="text-xs text-gray-500 uppercase font-bold tracking-wide">Demographics</label>
                                <div class="text-gray-900">${p.sex}, ${frappe.datetime.str_to_user(p.dob).split(' ')[0] || 'DOB N/A'}</div>
                            </div>
                            <div class="md:col-span-2">
                                <label class="text-xs text-gray-500 uppercase font-bold tracking-wide">Address</label>
                                <div class="text-gray-900">${p.address || '-'}</div>
                            </div>
                            <div>
                                <label class="text-xs text-gray-500 uppercase font-bold tracking-wide">Referring Doctor</label>
                                <div class="text-gray-900 font-medium">${p.practitioner || '-'}</div>
                            </div>
                            <div>
                                <label class="text-xs text-gray-500 uppercase font-bold tracking-wide">Registration Date</label>
                                <div class="text-gray-900">${frappe.datetime.str_to_user(p.creation).split(' ')[0]}</div>
                            </div>
                        </div>
                    `;

                    d.fields_dict.details_html.$wrapper.html(details_html);
                    d.show();
                }
            }
        });
    }
}

class PatientRegistrationComponent {
    constructor(page_manager) {
        this.page_manager = page_manager;
    }

    render(container) {
        let form_data = {}; // To store data between steps
        let current_step = 0;

        let form_wrapper = $('<div class="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 max-w-4xl mx-auto my-6"></div>').appendTo(container);

        let header = $('<div class="flex justify-between items-center mb-6 border-b border-gray-100 pb-4"></div>').appendTo(form_wrapper);
        $('<h3 class="text-xl font-bold text-gray-800 m-0">Register New Patient</h3>').appendTo(header);

        let close_btn = $('<button class="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-50"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-x"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>').appendTo(header);
        close_btn.on('click', () => {
            frappe.confirm('Are you sure you want to close? Any unsaved changes will be lost.', () => {
                this.page_manager.load_view({ id: 'patient_list' });
            });
        });

        let step_display = $('<div class="mb-8 text-center bg-gray-50 py-2 rounded-lg text-sm text-gray-500 font-medium"></div>').appendTo(form_wrapper);
        let form_body = $('<div></div>').appendTo(form_wrapper);
        let action_area = $('<div class="mt-8 flex justify-between items-center pt-4 border-t border-gray-50"></div>').appendTo(form_wrapper);

        const steps = [
            {
                title: 'Patient Details',
                fields: [
                    { fieldtype: 'Section Break', label: 'Primary Information' },
                    { fieldname: 'first_name', label: 'First Name', fieldtype: 'Data', reqd: 1 },
                    { fieldname: 'last_name', label: 'Last Name', fieldtype: 'Data' },
                    { fieldtype: 'Column Break' },
                    { fieldname: 'gender', label: 'Gender', fieldtype: 'Select', options: ['Male', 'Female', 'Other'], reqd: 1 },
                    { fieldname: 'dob', label: 'Date of Birth', fieldtype: 'Date' },
                ]
            },
            {
                title: 'Contact & Doctor',
                fields: [
                    { fieldtype: 'Section Break', label: 'Contact Details' },
                    { fieldname: 'mobile', label: 'Mobile Number', fieldtype: 'Data', reqd: 1 },
                    { fieldname: 'email', label: 'Email Address', fieldtype: 'Data' },
                    { fieldtype: 'Column Break' },
                    { fieldname: 'address', label: 'Address', fieldtype: 'Small Text' },
                    { fieldtype: 'Section Break', label: 'Referring Doctor' },
                    { fieldname: 'practitioner', label: 'Referring Doctor', fieldtype: 'Link', options: 'Healthcare Practitioner' },
                ]
            }
        ];

        let render_step = (step_index) => {
            current_step = step_index;
            let step = steps[step_index];
            step_display.html(render_progress_bar(steps, step_index));

            form_body.empty();
            action_area.empty();

            let field_group = new frappe.ui.FieldGroup({
                fields: step.fields,
                body: form_body
            });
            field_group.make();

            if (form_data[step_index]) {
                field_group.set_values(form_data[step_index]);
            }

            if (current_step > 0) {
                $('<button class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Previous</button>')
                    .appendTo(action_area)
                    .on('click', () => {
                        form_data[current_step] = field_group.get_values();
                        render_step(current_step - 1);
                    });
            } else {
                $('<div></div>').appendTo(action_area);
            }

            if (current_step < steps.length - 1) {
                $('<button class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">Next</button>')
                    .appendTo(action_area)
                    .on('click', () => {
                        let values = field_group.get_values();
                        if (values) {
                            form_data[current_step] = values;
                            render_step(current_step + 1);
                        }
                    });
            } else {
                $('<button class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm font-medium">Register Patient</button>')
                    .appendTo(action_area)
                    .on('click', () => {
                        let values = field_group.get_values();
                        if (values) {
                            form_data[current_step] = values;

                            let final_data = {};
                            Object.values(form_data).forEach(step_data => {
                                Object.assign(final_data, step_data);
                            });

                            frappe.call({
                                method: 'frappe.client.insert',
                                args: {
                                    doc: {
                                        doctype: 'Patient',
                                        first_name: final_data.first_name,
                                        last_name: final_data.last_name,
                                        sex: final_data.gender,
                                        practitioner: final_data.practitioner,
                                        mobile: final_data.mobile,
                                        email: final_data.email,
                                        dob: final_data.dob,
                                        address: final_data.address
                                    }
                                },
                                callback: (r) => {
                                    if (!r.exc) {
                                        frappe.show_alert({ message: `Patient Registered: ${r.message.name} `, indicator: 'green' }, 5);
                                        this.page_manager.load_view({ id: 'patient_list' });
                                    }
                                }
                            });
                        }
                    });
            }
        }

        render_step(0);
    }
}

class SampleCollectionListComponent {
    constructor(page_manager) {
        this.page_manager = page_manager;
        this.start = 0;
        this.page_length = 10;
        this.total_count = 0;
        this.current_search = '';
    }

    render(container) {
        let wrapper = $('<div class="max-w-7xl mx-auto"></div>').appendTo(container);

        // Header
        let header = $('<div class="flex justify-between items-center mb-6"></div>').appendTo(wrapper);
        $('<h3 class="text-2xl font-bold text-gray-800">Sample Collections</h3>').appendTo(header);
        let action_btn = $('<button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium flex items-center gap-2"></button>').appendTo(header);
        $(`<span>${frappe.utils.icon('plus', 'sm')}</span><span>New Collection</span>`).appendTo(action_btn);

        action_btn.on('click', () => {
            this.page_manager.load_view({ id: 'sample' });
        });

        // Filter/Search
        let filter_area = $('<div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex gap-4"></div>').appendTo(wrapper);
        let search_input = $('<input type="text" placeholder="Search by patient name..." class="form-control w-full md:w-96">').appendTo(filter_area);

        let debounce_timer;
        search_input.on('input', () => {
            clearTimeout(debounce_timer);
            debounce_timer = setTimeout(() => {
                this.current_search = search_input.val();
                this.start = 0;
                this.fetch_samples();
            }, 300);
        });

        // List Area
        this.list_area = $('<div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"></div>').appendTo(wrapper);
        this.table_container = $('<div></div>').appendTo(this.list_area);

        // Pagination Footer
        this.footer = $(`
            <div class="bg-gray-50 border-t border-gray-200 px-6 py-3 flex items-center justify-between">
                <div class="flex items-center gap-2 text-sm text-gray-600">
                    <span>Rows per page:</span>
                    <select class="form-control h-8 w-16 text-xs p-1 bg-white border-gray-300 rounded" id="rows-per-page">
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                    </select>
                </div>
                <div class="flex items-center gap-4 text-sm text-gray-600">
                    <span id="page-info">Showing 0-0 of 0</span>
                    <div class="flex gap-1">
                        <button class="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed" id="prev-btn" disabled>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-chevron-left"><polyline points="15 18 9 12 15 6"></polyline></svg>
                        </button>
                        <button class="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed" id="next-btn" disabled>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-chevron-right"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </button>
                    </div>
                </div>
            </div>
        `).appendTo(this.list_area);

        // Footer Events
        this.footer.find('#rows-per-page').on('change', (e) => {
            this.page_length = parseInt($(e.currentTarget).val());
            this.start = 0;
            this.fetch_samples();
        });

        this.footer.find('#prev-btn').on('click', () => {
            if (this.start > 0) {
                this.start -= this.page_length;
                this.fetch_samples();
            }
        });

        this.footer.find('#next-btn').on('click', () => {
            if (this.start + this.page_length < this.total_count) {
                this.start += this.page_length;
                this.fetch_samples();
            }
        });

        this.fetch_samples();
    }

    fetch_samples() {
        let filters = [];
        if (this.current_search) {
            filters = [
                ['Sample Collection', 'patient_name', 'like', `%${this.current_search}%`]
            ];
        }

        // 1. Get Count
        frappe.call({
            method: 'frappe.client.get_list',
            args: {
                doctype: 'Sample Collection',
                filters: filters,
                fields: ['name'],
                limit: 999999
            },
            callback: (r_count) => {
                this.total_count = r_count.message ? r_count.message.length : 0;

                // 2. Get Data Page
                frappe.call({
                    method: 'frappe.client.get_list',
                    args: {
                        doctype: 'Sample Collection',
                        fields: ['name', 'patient', 'patient_name', 'creation'],
                        order_by: 'creation desc',
                        limit_start: this.start,
                        limit_page_length: this.page_length,
                        filters: filters
                    },
                    callback: (r) => {
                        this.render_list(r.message || []);
                        this.update_pagination_ui();
                    }
                });
            }
        });
    }

    update_pagination_ui() {
        let end = Math.min(this.start + this.page_length, this.total_count);
        let start_disp = this.total_count > 0 ? this.start + 1 : 0;

        this.footer.find('#page-info').text(`Showing ${start_disp}-${end} of ${this.total_count}`);

        let prev_btn = this.footer.find('#prev-btn');
        let next_btn = this.footer.find('#next-btn');

        prev_btn.prop('disabled', this.start <= 0);
        next_btn.prop('disabled', end >= this.total_count);

        if (this.start <= 0) prev_btn.addClass('opacity-50 cursor-not-allowed').removeClass('hover:bg-gray-200');
        else prev_btn.removeClass('opacity-50 cursor-not-allowed').addClass('hover:bg-gray-200');

        if (end >= this.total_count) next_btn.addClass('opacity-50 cursor-not-allowed').removeClass('hover:bg-gray-200');
        else next_btn.removeClass('opacity-50 cursor-not-allowed').addClass('hover:bg-gray-200');
    }

    render_list(samples) {
        this.table_container.empty();
        let table = $(`
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collection ID</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200"></tbody>
            </table>
        `).appendTo(this.table_container);

        if (samples.length === 0) {
            this.table_container.html('<div class="p-8 text-center text-gray-500">No samples found.</div>');
            return;
        }

        samples.forEach(s => {
            $(`
                <tr class="hover:bg-gray-50 transition-colors">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">${s.name}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900">${s.patient_name || s.patient}</div>
                        <div class="text-xs text-gray-500">${s.patient}</div>
                    </td>
                     <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${frappe.datetime.str_to_user(s.creation).split(' ')[0]}</td>
                </tr>
            `).appendTo(table.find('tbody'));
        });
    }
}

class SampleCollectionComponent {
    constructor(page_manager) {
        this.page_manager = page_manager;
    }

    render(container) {
        let form_wrapper = $('<div class="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 max-w-4xl mx-auto my-6"></div>').appendTo(container);
        let header = $('<div class="flex justify-between items-center mb-6 border-b border-gray-100 pb-4"></div>').appendTo(form_wrapper);
        let title_el = $('<h3 class="text-xl font-bold text-gray-800 m-0">Sample Collection - Step 1</h3>').appendTo(header);

        let close_btn = $('<button class="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-50"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-x"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>').appendTo(header);
        close_btn.on('click', () => {
            this.page_manager.load_view({ id: 'sample_list' });
        });

        let step_display = $('<div class="mb-8 text-center bg-gray-50 py-2 rounded-lg text-sm text-gray-500 font-medium"></div>').appendTo(form_wrapper);
        let form_body = $('<div></div>').appendTo(form_wrapper);
        let action_area = $('<div class="mt-8 flex justify-between items-center pt-4 border-t border-gray-50"></div>').appendTo(form_wrapper);

        let selected_patient = null;
        let selected_patient_doctor = null;
        let pending_tests_cache = [];
        let selected_tests = [];

        const steps = [
            { title: 'Select Patient', id: 'patient' },
            { title: 'Select Tests', id: 'tests' },
            { title: 'Confirm Collection', id: 'confirm' }
        ];

        let render_step = (step_index) => {
            let step = steps[step_index];
            title_el.text(`Sample Collection - ${step.title} `);
            step_display.html(render_progress_bar(steps, step_index));
            form_body.empty();
            action_area.empty();

            if (step_index > 0) {
                $('<button class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Previous</button>').appendTo(action_area).click(() => render_step(step_index - 1));
            } else { $('<div></div>').appendTo(action_area); }

            let render_next = (label, handler) => {
                $(`<button class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">${label}</button>`).appendTo(action_area).click(handler);
            }

            if (step.id === 'patient') {
                let patient_fg = new frappe.ui.FieldGroup({
                    fields: [
                        { fieldname: 'patient', label: 'Select Patient', fieldtype: 'Link', options: 'Patient', reqd: 1, default: selected_patient }
                    ],
                    body: form_body
                });
                patient_fg.make();

                render_next('Next', () => {
                    let val = patient_fg.get_value('patient');
                    if (val) {
                        selected_patient = val;
                        // Fetch Patient Details
                        frappe.call({
                            method: 'pathohub.pathohub.page.franchisee.franchisee.get_patient_doctor',
                            args: { patient: selected_patient },
                            callback: (r) => {
                                if (r.message) {
                                    selected_patient_doctor = r.message;
                                } else {
                                    selected_patient_doctor = null;
                                }
                            }
                        });

                        // Fetch samples here
                        form_body.html('<p class="text-muted">Fetching pending samples...</p>');
                        frappe.call({
                            method: 'pathohub.pathohub.page.franchisee.franchisee.get_pending_samples',
                            args: { patient: selected_patient },
                            callback: (r) => {
                                pending_tests_cache = r.message || [];
                                if (pending_tests_cache.length > 0) {
                                    render_step(step_index + 1);
                                } else {
                                    frappe.msgprint("No pending sample collections for this patient.");
                                    render_step(step_index); // Redraw
                                }
                            }
                        });
                    } else {
                        frappe.msgprint("Please select a patient.");
                    }
                });

            } else if (step.id === 'tests') {
                let table = $(`
                        <table class="w-full text-left text-sm text-gray-500 mt-4 border border-gray-200 rounded-lg">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="p-3 w-10 text-center border-b border-gray-200"><input type="checkbox" id="select_all_samples" class="rounded border-gray-300"></th>
                                <th class="p-3 border-b border-gray-200">Test Name</th>
                                <th class="p-3 border-b border-gray-200">Status</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                        `).appendTo(form_body);

                pending_tests_cache.forEach(test => {
                    let is_checked = selected_tests.includes(test.name);
                    let row = $(`
                        <tr class="hover:bg-gray-50 border-b border-gray-100 last:border-0">
                            <td class="p-3 text-center"><input type="checkbox" class="sample-checkbox rounded border-gray-300" data-test="${test.name}" ${is_checked ? 'checked' : ''}></td>
                            <td class="p-3 font-medium text-gray-800">${test.lab_test_name}</td>
                            <td class="p-3">${test.status}</td>
                        </tr>
                        `).appendTo(table.find('tbody'));
                });

                // Checkbox logic
                table.on('change', '.sample-checkbox', function () {
                    let test_name = $(this).data('test');
                    if ($(this).prop('checked')) {
                        if (!selected_tests.includes(test_name)) selected_tests.push(test_name);
                    } else {
                        selected_tests = selected_tests.filter(t => t !== test_name);
                    }
                });

                table.find('#select_all_samples').on('change', function () {
                    let checked = $(this).prop('checked');
                    table.find('.sample-checkbox').prop('checked', checked).trigger('change');
                });

                render_next('Next', () => {
                    if (selected_tests.length > 0) {
                        render_step(step_index + 1);
                    } else {
                        frappe.msgprint("Please select at least one test.");
                    }
                });

            } else if (step.id === 'confirm') {
                $(`<p class="mb-4">Collecting samples for <strong class="text-gray-900">${selected_patient}</strong>:</p>`).appendTo(form_body);
                let ul = $('<ul class="list-disc pl-5 space-y-1 text-gray-700 mb-6"></ul>').appendTo(form_body);
                pending_tests_cache.filter(t => selected_tests.includes(t.name)).forEach(t => {
                    $('<li>' + t.lab_test_name + '</li>').appendTo(ul);
                });

                // Collection Details Fields
                $('<h5 class="font-bold text-gray-800 mb-3">Collection Details</h5>').appendTo(form_body);
                let collection_fg = new frappe.ui.FieldGroup({
                    fields: [
                        { fieldname: 'doctor', label: 'Doctor Name', fieldtype: 'Link', options: 'Healthcare Practitioner', default: selected_patient_doctor },
                        { fieldname: 'sample_qty', label: 'Sample Quantity', fieldtype: 'Float', reqd: 0 },
                        { fieldname: 'sample_uom', label: 'UOM', fieldtype: 'Data', reqd: 0 },
                        { fieldtype: 'Column Break' },
                        { fieldname: 'collection_date', label: 'Collection Date', fieldtype: 'Date', reqd: 1, default: frappe.datetime.get_today() },
                        { fieldname: 'collection_time', label: 'Collection Time', fieldtype: 'Time', reqd: 1, default: frappe.datetime.now_time() }
                    ],
                    body: form_body
                });
                collection_fg.make();

                render_next('Collect Samples', () => {
                    let values = collection_fg.get_values();
                    let btn = action_area.find('button.bg-blue-600');
                    btn.prop('disabled', true).addClass('opacity-50 cursor-not-allowed');

                    frappe.call({
                        method: 'pathohub.pathohub.page.franchisee.franchisee.create_sample_collection',
                        args: {
                            patient: selected_patient,
                            tests: selected_tests,
                            collection_date: values.collection_date,
                            collection_time: values.collection_time,
                            sample_qty: values.sample_qty,
                            sample_uom: values.sample_uom,
                            practitioner: values.doctor
                        },
                        freeze: true,
                        callback: (r) => {
                            if (!r.exc) {
                                frappe.show_alert({ message: 'Samples Collected Successfully', indicator: 'green' });
                                this.page_manager.load_view({ id: 'sample_list' });
                            } else {
                                btn.prop('disabled', false).removeClass('opacity-50 cursor-not-allowed');
                            }
                        }
                    });
                });
            }
        };

        render_step(0);
    }
}

class PatientReportComponent {
    constructor(page_manager) {
        this.page_manager = page_manager;
    }

    render(container) {
        let form_wrapper = $('<div class="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 max-w-5xl mx-auto my-6"></div>').appendTo(container);

        let header = $('<div class="flex justify-between items-center mb-6 border-b border-gray-100 pb-4"></div>').appendTo(form_wrapper);
        $('<h3 class="text-xl font-bold text-gray-800 m-0">Patient Reports</h3>').appendTo(header);

        let close_btn = $('<button class="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-50"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-x"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>').appendTo(header);
        close_btn.on('click', () => {
            this.page_manager.load_view({ id: 'dashboard' });
        });

        let filter_area = $('<div class="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4"></div>').appendTo(form_wrapper);
        let list_area = $('<div></div>').appendTo(form_wrapper);

        let patient_filter = new frappe.ui.FieldGroup({
            fields: [
                {
                    fieldname: 'patient',
                    label: 'Filter by Patient',
                    fieldtype: 'Link',
                    options: 'Patient',
                    onchange: () => refresh_list()
                }
            ],
            body: filter_area
        });
        patient_filter.make();

        let refresh_list = () => {
            let patient = patient_filter.get_value('patient');
            let filters = { status: 'Completed' };
            if (patient) filters.patient = patient;

            frappe.call({
                method: 'frappe.client.get_list',
                args: {
                    doctype: 'Lab Test',
                    filters: filters,
                    fields: ['name', 'patient_name', 'lab_test_name', 'creation', 'status'],
                    order_by: 'creation desc',
                    limit: 50
                },
                callback: (r) => {
                    render_table(r.message || []);
                }
            });
        }

        let render_table = (reports) => {
            list_area.empty();
            if (reports.length === 0) {
                list_area.html('<div class="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">No completed reports found.</div>');
                return;
            }

            let table = $(`
                <div class="overflow-x-auto rounded-lg border border-gray-200">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test Name</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200"></tbody>
                    </table>
                </div>
            `).appendTo(list_area);

            reports.forEach(report => {
                let $row = $(`
                    <tr class="hover:bg-gray-50 transition-colors">
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${frappe.datetime.str_to_user(report.creation).split(' ')[0]}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">${report.patient_name}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${report.lab_test_name}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button class="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-full text-xs font-bold transition-colors">View</button>
                        </td>
                    </tr>
                `).appendTo(table.find('tbody'));

                $row.find('button').text('View Report').on('click', () => {
                    // Logic to view report or print it
                    // Assuming it might redirect or show modal, but keeping it simple as per original
                    // Original said "Enter Result" but logic was load_view('result_entry') which is for entering result.
                    // But reports are usually COMPLETED here (status='Completed').
                    // Original code: button text 'View', then updated to 'Enter Result' and clicked to 'result_entry'.
                    // If status is completed, result entry might be readable or edit? 
                    // I'll keep the behavior.
                    this.page_manager.load_view({ id: 'result_entry', test_name: report.name });
                });
            });
        }

        refresh_list();
    }
}

class BillingFormComponent {
    constructor(page_manager) {
        this.page_manager = page_manager;
    }

    render(container) {
        let form_wrapper = $('<div class="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 max-w-5xl mx-auto my-6"></div>').appendTo(container);
        let header = $('<div class="flex justify-between items-center mb-6 border-b border-gray-100 pb-4"></div>').appendTo(form_wrapper);
        let title_el = $('<h3 class="text-xl font-bold text-gray-800 m-0">Create Invoice - Step 1</h3>').appendTo(header);

        let close_btn = $('<button class="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-50"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-x"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>').appendTo(header);
        close_btn.on('click', () => {
            this.page_manager.load_view({ id: 'dashboard' });
        });

        let step_display = $('<div class="mb-8 text-center bg-gray-50 py-2 rounded-lg text-sm text-gray-500 font-medium"></div>').appendTo(form_wrapper);
        let form_body = $('<div></div>').appendTo(form_wrapper);
        let action_area = $('<div class="mt-8 flex justify-between items-center pt-4 border-t border-gray-50"></div>').appendTo(form_wrapper);

        let selected_patient = null;
        let selected_tests = {};
        let all_tests_cache = [];

        const steps = [
            { title: 'Select Patient', id: 'patient' },
            { title: 'Select Tests', id: 'tests' },
            { title: 'Review & Pay', id: 'review' }
        ];

        let render_step = (step_index) => {
            let step = steps[step_index];
            title_el.text(`Create Invoice - ${step.title} `);
            step_display.html(`Step ${step_index + 1} of ${steps.length}: <span class="text-blue-600 font-semibold">${step.title}</span>`);
            form_body.empty();
            action_area.empty();

            // Prev Button
            if (step_index > 0) {
                $('<button class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Previous</button>')
                    .appendTo(action_area)
                    .on('click', () => render_step(step_index - 1));
            } else {
                $('<div></div>').appendTo(action_area);
            }

            // Next/Pay Button Logic
            let render_next = (label, handler) => {
                $(`<button class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">${label}</button>`)
                    .appendTo(action_area)
                    .on('click', handler);
            }

            if (step.id === 'patient') {
                let patient_fg = new frappe.ui.FieldGroup({
                    fields: [
                        { fieldname: 'patient', label: 'Select Patient', fieldtype: 'Link', options: 'Patient', reqd: 1, default: selected_patient }
                    ],
                    body: form_body
                });
                patient_fg.make();

                render_next('Next', () => {
                    let val = patient_fg.get_value('patient');
                    if (val) {
                        selected_patient = val;
                        render_step(step_index + 1);
                    } else {
                        frappe.msgprint("Please select a patient.");
                    }
                });
            } else if (step.id === 'tests') {
                let tests_container = $('<div></div>').appendTo(form_body);
                let tests_list = $('<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>').appendTo(tests_container);

                let render_tests = (tests) => {
                    tests.forEach(test => {
                        let test_rate = test.lab_test_rate || 0;
                        let is_selected = selected_tests[test.name] ? true : false;
                        let style_class = is_selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300';

                        let test_card = $(`
                            <div class="border rounded-lg p-4 cursor-pointer transition-all ${style_class}" data-name="${test.name}">
                                <div class="flex justify-between items-start">
                                    <div>
                                        <h6 class="font-medium text-gray-900">${test.lab_test_name}</h6>
                                        <p class="text-sm text-gray-500 mt-1">Rate: ${test_rate}</p>
                                    </div>
                                    ${is_selected ? '<div class="text-blue-600"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-check-circle"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg></div>' : ''}
                                </div>
                            </div>
                        `).appendTo(tests_list);

                        test_card.on('click', function () {
                            if (selected_tests[test.name]) {
                                delete selected_tests[test.name];
                            } else {
                                selected_tests[test.name] = { name: test.lab_test_name, rate: test_rate, item_code: test.name };
                            }
                            // Re-render simplified logic for visual update (could be optimized)
                            tests_list.empty();
                            render_tests(tests);
                        });
                    });
                };

                if (all_tests_cache.length > 0) {
                    render_tests(all_tests_cache);
                } else {
                    frappe.call({
                        method: 'frappe.client.get_list',
                        args: {
                            doctype: 'Lab Test Template',
                            fields: ['name', 'lab_test_name', 'lab_test_rate']
                        },
                        callback: r => {
                            if (r.message) {
                                all_tests_cache = r.message;
                                render_tests(all_tests_cache);
                            }
                        }
                    });
                }

                render_next('Next', () => {
                    if (Object.keys(selected_tests).length > 0) {
                        render_step(step_index + 1);
                    } else {
                        frappe.msgprint("Please select at least one test.");
                    }
                });
            } else if (step.id === 'review') {
                let total = 0;
                $(`<div class="mb-4 p-4 bg-gray-50 rounded-lg"><span class="text-gray-500">Customer:</span> <strong class="text-gray-900 ml-2">${selected_patient}</strong></div>`).appendTo(form_body);

                let review_table = $(`
                        <table class="w-full text-left text-sm text-gray-500 border border-gray-200 rounded-lg overflow-hidden">
                        <thead class="bg-gray-50">
                            <tr><th class="p-3 border-b border-gray-200">Test</th><th class="p-3 border-b border-gray-200 text-right">Rate</th></tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100"></tbody>
                    </table>
                        `).appendTo(form_body);

                Object.values(selected_tests).forEach(t => {
                    total += t.rate;
                    review_table.find('tbody').append(`<tr><td class="p-3 text-gray-900">${t.name}</td><td class="p-3 text-right font-medium">${t.rate}</td></tr>`);
                });

                $(`<div class="mt-6 text-right"><span class="text-gray-500 mr-2">Total Amount:</span><span class="text-2xl font-bold text-gray-900">${frappe.format(total, { fieldtype: 'Currency' })}</span></div>`).appendTo(form_body);

                render_next('Pay & Create Invoice', () => {
                    let invoice_items = Object.values(selected_tests).map(test => {
                        return {
                            item_code: test.item_code,
                            item_name: test.name,
                            qty: 1,
                            rate: test.rate
                        };
                    });

                    frappe.confirm(`Confirm payment of ${frappe.format(total, { fieldtype: 'Currency' })}?`, () => {
                        frappe.call({
                            method: 'pathohub.pathohub.page.franchisee.franchisee.create_invoice_with_payment',
                            args: {
                                customer: selected_patient,
                                items: invoice_items
                            },
                            callback: r => {
                                if (!r.exc) {
                                    frappe.show_alert({ message: `Success.Invoice ${r.message.name} created.`, indicator: 'green' }, 7);
                                    this.page_manager.load_view({ id: 'dashboard' });
                                }
                            }
                        });
                    });
                });
            }
        };

        render_step(0);
    }
}

class LabTestResultEntryComponent {
    constructor(page_manager) {
        this.page_manager = page_manager;
    }

    render(container, params) {
        if (!params || !params.test_name) {
            container.html('<div class="bg-red-50 text-red-700 p-4 rounded-lg">No Lab Test selected.</div>');
            return;
        }
        let test_name = params.test_name;

        let form_wrapper = $('<div class="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 max-w-4xl mx-auto my-6"></div>').appendTo(container);
        let header = $('<div class="flex justify-between items-center mb-6 border-b border-gray-100 pb-4"></div>').appendTo(form_wrapper);
        let title_el = $('<h3 class="text-xl font-bold text-gray-800 m-0">Enter Result - Step 1</h3>').appendTo(header);

        let close_btn = $('<button class="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-50"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-x"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>').appendTo(header);
        close_btn.on('click', () => {
            this.page_manager.load_view({ id: 'dashboard' });
        });

        let step_display = $('<div class="mb-8 text-center bg-gray-50 py-2 rounded-lg text-sm text-gray-500 font-medium"></div>').appendTo(form_wrapper);
        let form_body = $('<div></div>').appendTo(form_wrapper);
        let action_area = $('<div class="mt-8 flex justify-between items-center pt-4 border-t border-gray-50"></div>').appendTo(form_wrapper);

        let lab_test_doc = null;

        const steps = [
            { title: 'Overview', id: 'overview' },
            { title: 'Result Entry', id: 'results' },
            { title: 'Finalize', id: 'finish' }
        ];

        let render_step = (step_index) => {
            let step = steps[step_index];
            title_el.text(`Enter Result - ${step.title} `);
            step_display.html(render_progress_bar(steps, step_index));
            form_body.empty();
            action_area.empty();

            if (step_index > 0) {
                $('<button class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Previous</button>').appendTo(action_area).click(() => render_step(step_index - 1));
            } else { $('<div></div>').appendTo(action_area); }

            let next_btn = (label, fn) => $('<button class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">' + label + '</button>').appendTo(action_area).click(fn);

            if (step.id === 'overview') {
                if (lab_test_doc) {
                    let fg = new frappe.ui.FieldGroup({
                        fields: [
                            { fieldname: 'patient', label: 'Patient', fieldtype: 'Link', options: 'Patient', read_only: 1 },
                            { fieldname: 'practitioner', label: 'Doctor', fieldtype: 'Link', options: 'Healthcare Practitioner', read_only: 1 },
                            { fieldname: 'lab_test_template', label: 'Test Template', fieldtype: 'Link', options: 'Lab Test Template', read_only: 1 }
                        ],
                        body: form_body
                    });
                    fg.make();
                    fg.set_values(lab_test_doc);
                }
                next_btn('Next', () => render_step(step_index + 1));

            } else if (step.id === 'results') {
                if (lab_test_doc.normal_test_items && lab_test_doc.normal_test_items.length > 0) {
                    let table = $(`<table class="w-full text-left text-sm text-gray-700 border border-gray-200 rounded-lg overflow-hidden">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="p-3 border-b">Parameter</th>
                                <th class="p-3 border-b border-l">Result</th>
                                <th class="p-3 border-b border-l">Unit</th>
                                <th class="p-3 border-b border-l">Range</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100"></tbody>
                     </table>`).appendTo(form_body);

                    lab_test_doc.normal_test_items.forEach(item => {
                        let row = $('<tr class="hover:bg-gray-50"></tr>').appendTo(table.find('tbody'));
                        $('<td class="p-3 font-medium">' + item.lab_test_name + '</td>').appendTo(row);
                        let input_td = $('<td class="p-3 border-l"></td>').appendTo(row);
                        let input = $(`<input type="text" class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow" value="${item.result_value || ''}">`).appendTo(input_td);

                        input.on('change', function () {
                            item.result_value = $(this).val();
                        });

                        $('<td class="p-3 border-l text-gray-500">' + (item.unit || '') + '</td>').appendTo(row);
                        $('<td class="p-3 border-l text-gray-500">' + (item.normal_range || '') + '</td>').appendTo(row);
                    });
                } else {
                    form_body.html('<div class="bg-yellow-50 text-yellow-700 p-4 rounded-lg">No structured parameters found. This might be a descriptive test.</div>');
                }

                next_btn('Next', () => render_step(step_index + 1));

            } else if (step.id === 'finish') {
                $('<h4 class="text-lg font-bold text-gray-800 mb-2">Review & Submit</h4>').appendTo(form_body);
                $('<p class="text-gray-600 mb-4">Please verify results before submitting.</p>').appendTo(form_body);

                let comments = $(`<textarea class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" placeholder="Technician Remarks" rows="3">${lab_test_doc.remarks || ''}</textarea>`).appendTo(form_body);
                comments.on('change', function () { lab_test_doc.remarks = $(this).val(); });

                let submit_btn = next_btn('Submit Results', () => {
                    submit_btn.prop('disabled', true).addClass('opacity-50 cursor-not-allowed');
                    lab_test_doc.status = 'Completed';
                    frappe.call({
                        method: 'frappe.client.save',
                        args: { doc: lab_test_doc },
                        callback: (r) => {
                            if (!r.exc) {
                                frappe.show_alert({ message: 'Lab Test Updated', indicator: 'green' });
                                this.page_manager.load_view({ id: 'patient_report' });
                            } else {
                                submit_btn.prop('disabled', false).removeClass('opacity-50 cursor-not-allowed');
                            }
                        }
                    });
                });
            }
        }

        frappe.call({
            method: 'frappe.client.get',
            args: { doctype: 'Lab Test', name: test_name },
            callback: (r) => {
                lab_test_doc = r.message;
                render_step(0);
            }
        });
    }
}

class LabTestListComponent {
    constructor(page_manager) {
        this.page_manager = page_manager;
        this.start = 0;
        this.page_length = 10;
        this.total_count = 0;
        this.current_search = '';
    }

    render(container) {
        let wrapper = $('<div class="max-w-7xl mx-auto"></div>').appendTo(container);

        // Header
        let header = $('<div class="flex justify-between items-center mb-6"></div>').appendTo(wrapper);
        $('<h3 class="text-2xl font-bold text-gray-800">Lab Tests</h3>').appendTo(header);
        let action_btn = $('<button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium flex items-center gap-2"></button>').appendTo(header);
        $(`<span>${frappe.utils.icon('plus', 'sm')}</span><span>New Lab Test</span>`).appendTo(action_btn);

        action_btn.on('click', () => {
            this.page_manager.load_view({ id: 'lab_test' });
        });

        // Filter/Search
        let filter_area = $('<div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex gap-4"></div>').appendTo(wrapper);
        let search_input = $('<input type="text" placeholder="Search by patient name..." class="form-control w-full md:w-96">').appendTo(filter_area);

        let debounce_timer;
        search_input.on('input', () => {
            clearTimeout(debounce_timer);
            debounce_timer = setTimeout(() => {
                this.current_search = search_input.val();
                this.start = 0;
                this.fetch_tests();
            }, 300);
        });

        // List Area
        this.list_area = $('<div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"></div>').appendTo(wrapper);
        this.table_container = $('<div></div>').appendTo(this.list_area);

        // Pagination Footer
        this.footer = $(`
            <div class="bg-gray-50 border-t border-gray-200 px-6 py-3 flex items-center justify-between">
                <div class="flex items-center gap-2 text-sm text-gray-600">
                    <span>Rows per page:</span>
                    <select class="form-control h-8 w-16 text-xs p-1 bg-white border-gray-300 rounded" id="rows-per-page">
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                    </select>
                </div>
                <div class="flex items-center gap-4 text-sm text-gray-600">
                    <span id="page-info">Showing 0-0 of 0</span>
                    <div class="flex gap-1">
                        <button class="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed" id="prev-btn" disabled>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-chevron-left"><polyline points="15 18 9 12 15 6"></polyline></svg>
                        </button>
                        <button class="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed" id="next-btn" disabled>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-chevron-right"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </button>
                    </div>
                </div>
            </div>
        `).appendTo(this.list_area);

        // Footer Events
        this.footer.find('#rows-per-page').on('change', (e) => {
            this.page_length = parseInt($(e.currentTarget).val());
            this.start = 0;
            this.fetch_tests();
        });

        this.footer.find('#prev-btn').on('click', () => {
            if (this.start > 0) {
                this.start -= this.page_length;
                this.fetch_tests();
            }
        });

        this.footer.find('#next-btn').on('click', () => {
            if (this.start + this.page_length < this.total_count) {
                this.start += this.page_length;
                this.fetch_tests();
            }
        });

        this.fetch_tests();
    }

    fetch_tests() {
        let filters = [];
        if (this.current_search) {
            filters = [
                ['Lab Test', 'patient_name', 'like', `%${this.current_search}%`]
            ];
        }

        // 1. Get Count
        frappe.call({
            method: 'frappe.client.get_list',
            args: {
                doctype: 'Lab Test',
                filters: filters,
                fields: ['name'],
                limit: 999999
            },
            callback: (r_count) => {
                this.total_count = r_count.message ? r_count.message.length : 0;

                // 2. Get Data Page
                frappe.call({
                    method: 'frappe.client.get_list',
                    args: {
                        doctype: 'Lab Test',
                        fields: ['name', 'patient_name', 'lab_test_name', 'creation', 'status'],
                        order_by: 'creation desc',
                        limit_start: this.start,
                        limit_page_length: this.page_length,
                        filters: filters
                    },
                    callback: (r) => {
                        this.render_list(r.message || []);
                        this.update_pagination_ui();
                    }
                });
            }
        });
    }

    update_pagination_ui() {
        let end = Math.min(this.start + this.page_length, this.total_count);
        let start_disp = this.total_count > 0 ? this.start + 1 : 0;

        this.footer.find('#page-info').text(`Showing ${start_disp}-${end} of ${this.total_count}`);

        let prev_btn = this.footer.find('#prev-btn');
        let next_btn = this.footer.find('#next-btn');

        prev_btn.prop('disabled', this.start <= 0);
        next_btn.prop('disabled', end >= this.total_count);

        if (this.start <= 0) prev_btn.addClass('opacity-50 cursor-not-allowed').removeClass('hover:bg-gray-200');
        else prev_btn.removeClass('opacity-50 cursor-not-allowed').addClass('hover:bg-gray-200');

        if (end >= this.total_count) next_btn.addClass('opacity-50 cursor-not-allowed').removeClass('hover:bg-gray-200');
        else next_btn.removeClass('opacity-50 cursor-not-allowed').addClass('hover:bg-gray-200');
    }

    render_list(tests) {
        this.table_container.empty();
        let table = $(`
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test ID</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test Name</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200"></tbody>
            </table>
        `).appendTo(this.table_container);

        if (tests.length === 0) {
            this.table_container.html('<div class="p-8 text-center text-gray-500">No lab tests found.</div>');
            return;
        }

        tests.forEach(t => {
            $(`
                <tr class="hover:bg-gray-50 transition-colors">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">${t.name}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900">${t.patient_name}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${t.lab_test_name}</td>
                     <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${frappe.datetime.str_to_user(t.creation)}</td>
                </tr>
            `).appendTo(table.find('tbody'));
        });
    }
}

class LabTestFormComponent {
    constructor(page_manager) {
        this.page_manager = page_manager;
    }

    render(container) {
        let form_wrapper = $('<div class="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 max-w-5xl mx-auto my-6"></div>').appendTo(container);
        let header = $('<div class="flex justify-between items-center mb-6 border-b border-gray-100 pb-4"></div>').appendTo(form_wrapper);
        let title_el = $('<h3 class="text-xl font-bold text-gray-800 m-0">Book Lab Test - Step 1</h3>').appendTo(header);

        let close_btn = $('<button class="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-50"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-x"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>').appendTo(header);
        close_btn.on('click', () => {
            this.page_manager.load_view({ id: 'lab_test_list' });
        });

        let step_display = $('<div class="mb-8 text-center bg-gray-50 py-2 rounded-lg text-sm text-gray-500 font-medium"></div>').appendTo(form_wrapper);
        let form_body = $('<div></div>').appendTo(form_wrapper);
        let action_area = $('<div class="mt-8 flex justify-between items-center pt-4 border-t border-gray-50"></div>').appendTo(form_wrapper);

        let selected_patient = null;
        let selected_doctor = null;
        let selected_gender = null;
        let selected_tests = [];
        let all_tests_cache = [];

        const steps = [
            { title: 'Select Patient', id: 'patient' },
            { title: 'Select Tests', id: 'tests' },
            { title: 'Confirm', id: 'confirm' }
        ];

        let render_step = (step_index) => {
            let step = steps[step_index];
            title_el.text(`Book Lab Test - ${step.title} `);
            step_display.html(render_progress_bar(steps, step_index));
            form_body.empty();
            action_area.empty();

            if (step_index > 0) {
                $('<button class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Previous</button>').appendTo(action_area).click(() => render_step(step_index - 1));
            } else { $('<div></div>').appendTo(action_area); }

            let render_next = (label, handler) => {
                $(`<button class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">${label}</button>`).appendTo(action_area).click(handler);
            }

            if (step.id === 'patient') {
                let fs = new frappe.ui.FieldGroup({
                    fields: [
                        {
                            fieldname: 'patient', label: 'Patient', fieldtype: 'Link', options: 'Patient', reqd: 1, default: selected_patient,
                            onchange: () => {
                                let patient = fs.get_value('patient');
                                if (patient) {
                                    frappe.db.get_value('Patient', patient, 'sex').then(r => {
                                        if (r && r.message && r.message.sex) {
                                            fs.set_value('gender', r.message.sex);
                                        }
                                    });
                                }
                            }
                        },
                        { fieldname: 'gender', label: 'Gender', fieldtype: 'Select', options: ['', 'Male', 'Female', 'Other'], reqd: 1, default: selected_gender },
                        { fieldname: 'practitioner', label: 'Referring Doctor', fieldtype: 'Link', options: 'Healthcare Practitioner', default: selected_doctor }
                    ],
                    body: form_body
                });
                fs.make();

                render_next('Next', () => {
                    let val = fs.get_values();
                    if (val.patient && val.gender) {
                        selected_patient = val.patient;
                        selected_doctor = val.practitioner;
                        selected_gender = val.gender;
                        render_step(step_index + 1);
                    } else {
                        frappe.msgprint("Please select a patient and ensure gender is set.");
                    }
                });
            } else if (step.id === 'tests') {
                let tests_container = $('<div></div>').appendTo(form_body);
                let tests_list = $('<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>').appendTo(tests_container);

                let render_tests = (tests) => {
                    tests.forEach(test => {
                        let is_selected = selected_tests.find(t => t.name === test.name) ? true : false;
                        let style_class = is_selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300';

                        let test_card = $(`
                            <div class="border rounded-lg p-4 cursor-pointer transition-all ${style_class}" data-name="${test.name}">
                                <div class="flex justify-between items-start">
                                    <h6 class="font-medium text-gray-900">${test.lab_test_name}</h6>
                                    ${is_selected ? '<div class="text-blue-600"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-check-circle"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg></div>' : ''}
                                </div>
                            </div>
                        `).appendTo(tests_list);

                        test_card.on('click', function () {
                            if (selected_tests.find(t => t.name === test.name)) {
                                selected_tests = selected_tests.filter(t => t.name !== test.name);
                            } else {
                                selected_tests.push(test);
                            }
                            tests_list.empty();
                            render_tests(tests);
                        });
                    });
                };

                if (all_tests_cache.length > 0) {
                    render_tests(all_tests_cache);
                } else {
                    frappe.call({
                        method: 'frappe.client.get_list',
                        args: {
                            doctype: 'Lab Test Template',
                            fields: ['name', 'lab_test_name'],
                            limit: 50
                        },
                        callback: r => {
                            if (r.message) {
                                all_tests_cache = r.message;
                                render_tests(all_tests_cache);
                            }
                        }
                    });
                }

                render_next('Next', () => {
                    if (selected_tests.length > 0) {
                        render_step(step_index + 1);
                    } else {
                        frappe.msgprint("Please select at least one test.");
                    }
                });
            } else if (step.id === 'confirm') {
                $(`<div class="bg-gray-50 rounded-lg p-4 mb-6">
                        <p class="mb-1"><span class="text-gray-500">Patient:</span> <strong class="text-gray-900">${selected_patient}</strong> (${selected_gender})</p>
                    ${selected_doctor ? `<p><span class="text-gray-500">Doctor:</span> <strong class="text-gray-900">${selected_doctor}</strong></p>` : ''}
                </div>`).appendTo(form_body);

                $('<h5 class="font-bold text-gray-800 mb-3">Selected Tests:</h5>').appendTo(form_body);
                let ul = $('<ul class="space-y-2"></ul>').appendTo(form_body);
                selected_tests.forEach(t => {
                    $('<li class="flex items-center text-gray-700"><span class="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>' + t.lab_test_name + '</li>').appendTo(ul);
                });

                $('<h5 class="font-bold text-gray-800 mb-3 mt-4">Schedule</h5>').appendTo(form_body);
                let schedule_fg = new frappe.ui.FieldGroup({
                    fields: [
                        { fieldname: 'schedule_date', label: 'Schedule Date', fieldtype: 'Date', reqd: 1, default: frappe.datetime.get_today() },
                        { fieldname: 'schedule_time', label: 'Schedule Time', fieldtype: 'Time', reqd: 1, default: frappe.datetime.now_time() }
                    ],
                    body: form_body
                });
                schedule_fg.make();

                render_next('Schedule Test', () => {
                    let values = schedule_fg.get_values();
                    let btn = action_area.find('button.bg-blue-600');
                    btn.text('Booking...').prop('disabled', true).addClass('opacity-75');

                    frappe.call({
                        method: 'pathohub.pathohub.page.franchisee.franchisee.create_manual_lab_tests',
                        args: {
                            patient: selected_patient,
                            practitioner: selected_doctor,
                            gender: selected_gender,
                            templates: selected_tests.map(t => t.name),
                            date: values.schedule_date,
                            time: values.schedule_time
                        },
                        freeze: true,
                        callback: (r) => {
                            if (!r.exc) {
                                frappe.show_alert({ message: 'Lab Tests Created Successfully', indicator: 'green' });
                                this.page_manager.load_view({ id: 'lab_test_list' });
                            } else {
                                btn.text('Book Information').prop('disabled', false).removeClass('opacity-75');
                            }
                        }
                    });
                });
            }
        }
        render_step(0);
    }
}