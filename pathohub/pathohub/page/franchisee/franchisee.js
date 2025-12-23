frappe.pages['franchisee'].on_page_load = function (wrapper) {
    new FranchiseePage(wrapper);
}

class FranchiseePage {
    constructor(wrapper) {
        this.wrapper = $(wrapper);
        this.page = frappe.ui.make_app_page({
            parent: wrapper,
            title: 'Franchisee'
        });

        this.components = {};
        this.setup_page_layout();
        this.setup_sidebar();
        this.setup_components();

        // Start with dashboard
        this.load_view({ id: 'dashboard' });
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

        // Create main container structure
        this.$row = $('<div class="franchisee-container"></div>').appendTo(this.page.main);
        this.sidebar_container = $(`<div class="franchisee-sidebar"></div>`).appendTo(this.$row);
        this.main_content = $(`<div class="franchisee-main"></div>`).appendTo(this.$row);
    }

    setup_sidebar() {
        this.sidebar_list = $('<ul class="nav nav-pills flex-column"></ul>').appendTo(this.sidebar_container);

        // Toggle button
        let toggle_btn = $(`
            <div class="sidebar-toggle-btn">
                ${frappe.utils.icon('chevrons-left', 'sm')}
            </div>
        `).prependTo(this.sidebar_container);

        toggle_btn.on('click', () => {
            this.sidebar_container.toggleClass('collapsed');
            if (this.sidebar_container.hasClass('collapsed')) {
                toggle_btn.html(frappe.utils.icon('chevrons-right', 'sm'));
                this.main_content.css('margin-left', '60px');
            } else {
                toggle_btn.html(frappe.utils.icon('chevrons-left', 'sm'));
                this.main_content.css('margin-left', '250px');
            }
        });

        let menu_items = [
            { "label": "Dashboard", "id": "dashboard", "icon": "dashboard" },
            { "label": "Register Patient", "id": "patient", "icon": "users" },
            { "label": "Create Invoice", "id": "billing", "icon": "billing" },
            { "label": "Sample Collection", "id": "sample", "icon": "edit" },
            { "label": "Patient Report", "id": "patient_report", "icon": "list-view" },
            { "label": "Lab Test", "id": "lab_test", "icon": "list" },
        ];

        menu_items.forEach(item => {
            let icon_html = frappe.utils.icon(item.icon || 'folder', 'sm');
            let $li = $(`<li class="nav-item">
                 <a class="nav-link" href="#" data-id="${item.id}">
                     <span class="icon">${icon_html}</span>
                     <span class="menu-label">${item.label}</span>
                 </a>
             </li>`);

            $li.find('a').on('click', (e) => {
                e.preventDefault();
                this.load_view(item);
            });

            this.sidebar_list.append($li);
        });
    }

    setup_components() {
        this.components.dashboard = new DashboardComponent(this);
        this.components.patient = new PatientRegistrationComponent(this);
        this.components.billing = new BillingFormComponent(this);
        this.components.sample = new SampleCollectionComponent(this);
        this.components.patient_report = new PatientReportComponent(this);
        this.components.result_entry = new LabTestResultEntryComponent(this);
    }

    load_view(item) {
        // Update active sidebar link
        this.sidebar_list.find('.nav-link').removeClass('active');
        this.sidebar_list.find(`a[data-id="${item.id}"]`).addClass('active');

        this.main_content.empty();

        if (item.id === 'dashboard') {
            this.components.dashboard.render(this.main_content);
        } else if (item.id === 'patient') {
            this.components.patient.render(this.main_content);
        } else if (item.id === 'billing') {
            this.components.billing.render(this.main_content);
        } else if (item.id === 'sample') {
            this.components.sample.render(this.main_content);
        } else if (item.id === 'patient_report') {
            this.components.patient_report.render(this.main_content);
        } else if (item.id === 'result_entry') {
            this.components.result_entry.render(this.main_content, item);
        } else if (item.id === 'lab_test') {
            frappe.new_doc('Lab Test');
        } else {
            this.main_content.html(`<h3>Error</h3><p>View not found.</p>`);
        }
    }
}

class DashboardComponent {
    constructor(page_manager) {
        this.page_manager = page_manager;
    }

    render(container) {
        $('<div style="margin-bottom: 20px; padding: 0 15px;"><h3>Franchisee Dashboard</h3></div>').appendTo(container);

        let filter_wrapper = $('<div class="dashboard-filters" style="margin: 0 15px 20px 15px; background: #fff; padding: 15px; border-radius: 4px; border: 1px solid #d1d8dd;"></div>').appendTo(container);

        let filters_fg = new frappe.ui.FieldGroup({
            fields: [
                { fieldname: 'from_date', label: 'From Date', fieldtype: 'Date', default: frappe.datetime.now_date() },
                { fieldname: 'to_date', label: 'To Date', fieldtype: 'Date', default: frappe.datetime.now_date() },
                { fieldname: 'refresh', label: 'Refresh', fieldtype: 'Button', click: () => load_stats() }
            ],
            body: filter_wrapper
        });
        filters_fg.make();

        let stats_area = $(`
            <div class="number-card-area row" style="padding: 0 15px;">
                <div class="col-lg-3 col-md-6 col-12">
                    <div class="card" style="margin-bottom: 15px;">
                        <div class="card-body">
                           <h5 class="card-title text-muted">Total Patients</h5>
                           <h3 class="card-text font-weight-bold" id="total_patients_card">...</h3>
                        </div>
                    </div>
                </div>
                <div class="col-lg-3 col-md-6 col-12">
                    <div class="card" style="margin-bottom: 15px;">
                        <div class="card-body">
                           <h5 class="card-title text-muted">Samples Collected</h5>
                           <h3 class="card-text font-weight-bold" id="samples_collected_card">...</h3>
                        </div>
                    </div>
                </div>
                 <div class="col-lg-3 col-md-6 col-12">
                      <div class="card" style="margin-bottom: 15px;">
                          <div class="card-body">
                             <h5 class="card-title text-muted">Pending Tests</h5>
                             <h3 class="card-text font-weight-bold" id="pending_tests_card">...</h3>
                          </div>
                      </div>
                  </div>
                <div class="col-lg-3 col-md-6 col-12">
                     <div class="card clickable-card" id="wallet-card-container" style="margin-bottom: 15px; cursor: pointer;">
                         <div class="card-body">
                            <h5 class="card-title text-muted">Wallet Balance</h5>
                            <h3 class="card-text font-weight-bold" id="wallet_balance_card">...</h3>
                            <p class="small text-primary" style="margin-bottom: 0;">Click to Add Funds</p>
                         </div>
                     </div>
                 </div>
            </div>
        `).appendTo(container);

        $('<div style="padding: 0 15px;"><p>Select an option from the menu.</p></div>').appendTo(container);

        let load_stats = () => {
            let args = filters_fg.get_values();
            frappe.call({
                method: 'pathohub.pathohub.page.franchisee.franchisee.get_dashboard_stats',
                args: args,
                callback: (r) => {
                    if (r.message) {
                        $('#total_patients_card').text(r.message.total_patients);
                        $('#samples_collected_card').text(r.message.samples_collected);
                        $('#pending_tests_card').text(r.message.pending_tests);
                        $('#wallet_balance_card').html(frappe.format(r.message.wallet_balance, { fieldtype: 'Currency' }));
                    }
                }
            });
        };

        stats_area.on('click', '#wallet-card-container', () => {
            frappe.prompt([
                { label: 'Amount to Add', fieldname: 'amount', fieldtype: 'Currency', reqd: 1 }
            ], (values) => {
                frappe.call({
                    method: 'pathohub.pathohub.page.franchisee.franchisee.recharge_wallet',
                    args: { amount: values.amount },
                    callback: (r) => {
                        if (!r.exc) {
                            frappe.show_alert({ message: 'Wallet Recharged Successfully', indicator: 'green' });
                            $('#wallet_balance_card').html(frappe.format(r.message, { fieldtype: 'Currency' }));
                        }
                    }
                });
            }, 'Add Funds to Wallet', 'Pay Now');
        });

        load_stats();
    }
}

class PatientRegistrationComponent {
    constructor(page_manager) {
        this.page_manager = page_manager;
    }

    render(container) {
        let form_data = {}; // To store data between steps
        let current_step = 0;

        let form_wrapper = $('<div class="form-wrapper"></div>').appendTo(container);

        let header = $('<div class="form-header"></div>').appendTo(form_wrapper);
        $('<h3>Register New Patient</h3>').appendTo(header);

        let close_btn = $('<button class="btn btn-default btn-sm">Cancel</button>').appendTo(header);
        close_btn.on('click', () => {
            frappe.confirm('Are you sure you want to close? Any unsaved changes will be lost.', () => {
                this.page_manager.load_view({ id: 'dashboard' });
            });
        });

        let step_display = $('<div class="step-display text-muted"></div>').appendTo(form_wrapper);
        let form_body = $('<div></div>').appendTo(form_wrapper);
        let action_area = $('<div class="form-actions" style="display: flex; justify-content: space-between;"></div>').appendTo(form_wrapper);

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
                    { fieldname: 'prescribed_by', label: 'Prescribed By', fieldtype: 'Link', options: 'Healthcare Practitioner' },
                ]
            }
        ];

        let render_step = (step_index) => {
            current_step = step_index;
            let step = steps[step_index];
            step_display.html(`Step ${step_index + 1} of ${steps.length}: <strong>${step.title}</strong>`);

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
                $('<button class="btn btn-default">Previous</button>')
                    .appendTo(action_area)
                    .on('click', () => {
                        form_data[current_step] = field_group.get_values();
                        render_step(current_step - 1);
                    });
            } else {
                $('<div></div>').appendTo(action_area);
            }

            if (current_step < steps.length - 1) {
                $('<button class="btn btn-primary">Next</button>')
                    .appendTo(action_area)
                    .on('click', () => {
                        let values = field_group.get_values();
                        if (values) {
                            form_data[current_step] = values;
                            render_step(current_step + 1);
                        }
                    });
            } else {
                $('<button class="btn btn-primary">Register Patient</button>')
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
                                        prescribed_by: final_data.prescribed_by,
                                        mobile: final_data.mobile,
                                        email: final_data.email,
                                        dob: final_data.dob,
                                        address: final_data.address
                                    }
                                },
                                callback: (r) => {
                                    if (!r.exc) {
                                        frappe.show_alert({ message: `Patient Registered: ${r.message.name}`, indicator: 'green' }, 5);
                                        this.page_manager.load_view({ id: 'dashboard' });
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

class SampleCollectionComponent {
    constructor(page_manager) {
        this.page_manager = page_manager;
    }

    render(container) {
        let form_wrapper = $('<div class="form-wrapper"></div>').appendTo(container);
        let header = $('<div class="form-header"></div>').appendTo(form_wrapper);
        let title_el = $('<h3>Sample Collection - Step 1</h3>').appendTo(header);

        let step_display = $('<div class="step-display text-muted"></div>').appendTo(form_wrapper);
        let form_body = $('<div></div>').appendTo(form_wrapper);
        let action_area = $('<div class="form-actions" style="display: flex; justify-content: space-between;"></div>').appendTo(form_wrapper);

        let selected_patient = null;
        let pending_tests_cache = [];
        let selected_tests = [];

        const steps = [
            { title: 'Select Patient', id: 'patient' },
            { title: 'Select Tests', id: 'tests' },
            { title: 'Confirm Collection', id: 'confirm' }
        ];

        let render_step = (step_index) => {
            let step = steps[step_index];
            title_el.text(`Sample Collection - ${step.title}`);
            step_display.html(`Step ${step_index + 1} of ${steps.length}: <strong>${step.title}</strong>`);
            form_body.empty();
            action_area.empty();

            if (step_index > 0) {
                $('<button class="btn btn-default">Previous</button>').appendTo(action_area).click(() => render_step(step_index - 1));
            } else { $('<div></div>').appendTo(action_area); }

            let render_next = (label, handler) => {
                $(`<button class="btn btn-primary">${label}</button>`).appendTo(action_area).click(handler);
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
                    <table class="table table-bordered table-hover margin-top">
                        <thead>
                            <tr>
                                <th width="40"><input type="checkbox" id="select_all_samples"></th>
                                <th>Test Name</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                `).appendTo(form_body);

                pending_tests_cache.forEach(test => {
                    let is_checked = selected_tests.includes(test.name);
                    let row = $(`
                        <tr>
                            <td class="text-center"><input type="checkbox" class="sample-checkbox" data-test="${test.name}" ${is_checked ? 'checked' : ''}></td>
                            <td>${test.lab_test_name}</td>
                            <td>${test.status}</td>
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
                $(`<p>Collecting samples for <strong>${selected_patient}</strong>:</p>`).appendTo(form_body);
                let ul = $('<ul></ul>').appendTo(form_body);
                pending_tests_cache.filter(t => selected_tests.includes(t.name)).forEach(t => {
                    $('<li>' + t.lab_test_name + '</li>').appendTo(ul);
                });

                render_next('Collect Samples', () => {
                    let btn = action_area.find('button.btn-primary');
                    btn.prop('disabled', true);

                    frappe.call({
                        method: 'pathohub.pathohub.page.franchisee.franchisee.create_sample_collection',
                        args: {
                            patient: selected_patient,
                            tests: selected_tests
                        },
                        freeze: true,
                        callback: (r) => {
                            if (!r.exc) {
                                frappe.show_alert({ message: 'Samples Collected Successfully', indicator: 'green' });
                                this.page_manager.load_view({ id: 'dashboard' });
                            } else {
                                btn.prop('disabled', false);
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
        let form_wrapper = $('<div class="form-wrapper"></div>').appendTo(container);

        let header = $('<div class="form-header"></div>').appendTo(form_wrapper);
        $('<h3>Patient Reports</h3>').appendTo(header);

        let filter_area = $('<div class="row" style="margin-bottom: 20px;"></div>').appendTo(form_wrapper);
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
                list_area.html('<div class="alert alert-info">No completed reports found.</div>');
                return;
            }

            let table = $(`
                <table class="table table-bordered table-hover">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Patient</th>
                            <th>Test Name</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            `).appendTo(list_area);

            reports.forEach(report => {
                let $row = $(`
                    <tr>
                        <td>${frappe.datetime.str_to_user(report.creation)}</td>
                        <td>${report.patient_name}</td>
                        <td>${report.lab_test_name}</td>
                        <td><button class="btn btn-xs btn-default">View</button></td>
                    </tr>
                `).appendTo(table.find('tbody'));

                $row.find('button').text('Enter Result').on('click', () => {
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
        let form_wrapper = $('<div class="form-wrapper"></div>').appendTo(container);
        let header = $('<div class="form-header"></div>').appendTo(form_wrapper);
        let title_el = $('<h3>Create Invoice - Step 1</h3>').appendTo(header);

        let step_display = $('<div class="step-display text-muted"></div>').appendTo(form_wrapper);
        let form_body = $('<div></div>').appendTo(form_wrapper);
        let action_area = $('<div class="form-actions" style="display: flex; justify-content: space-between;"></div>').appendTo(form_wrapper);

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
            title_el.text(`Create Invoice - ${step.title}`);
            step_display.html(`Step ${step_index + 1} of ${steps.length}: <strong>${step.title}</strong>`);
            form_body.empty();
            action_area.empty();

            // Prev Button
            if (step_index > 0) {
                $('<button class="btn btn-default">Previous</button>')
                    .appendTo(action_area)
                    .on('click', () => render_step(step_index - 1));
            } else {
                $('<div></div>').appendTo(action_area);
            }

            // Next/Pay Button Logic
            let render_next = (label, handler) => {
                $(`<button class="btn btn-primary">${label}</button>`)
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
                let tests_container = $('<div class="tests-container"></div>').appendTo(form_body);
                let tests_list = $('<div class="tests-list row"></div>').appendTo(tests_container);

                let render_tests = (tests) => {
                    tests.forEach(test => {
                        let test_rate = test.lab_test_rate || 0;
                        let is_selected = selected_tests[test.name] ? 'selected-card' : '';
                        let style = is_selected ? 'border-color: #3182ce; background-color: #ebf8ff;' : 'border: 1px solid #d1d8dd;';

                        let test_card = $(`
                            <div class="col-md-4">
                                <div class="card test-card ${is_selected}" data-name="${test.name}" style="margin-bottom: 15px; cursor: pointer; ${style}">
                                    <div class="card-body">
                                        <h6 class="card-title">${test.lab_test_name}</h6>
                                        <p class="card-text text-muted small">Rate: ${test_rate}</p>
                                    </div>
                                </div>
                            </div>
                        `).appendTo(tests_list);

                        test_card.on('click', function () {
                            $(this).toggleClass('selected-card');
                            let is_sel = $(this).hasClass('selected-card');

                            // Visual update manually since CSS class might need style override
                            if (is_sel) {
                                $(this).css({ 'border-color': '#3182ce', 'background-color': '#ebf8ff' });
                                selected_tests[test.name] = { name: test.lab_test_name, rate: test_rate, item_code: test.name };
                            } else {
                                $(this).css({ 'border-color': '#d1d8dd', 'background-color': '' });
                                delete selected_tests[test.name];
                            }
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
                $(`<p>Customer: <strong>${selected_patient}</strong></p>`).appendTo(form_body);
                let review_table = $(`
                    <table class="table table-bordered" style="margin-top: 15px;">
                        <thead><tr><th>Test</th><th>Rate</th></tr></thead>
                        <tbody></tbody>
                    </table>
                `).appendTo(form_body);

                Object.values(selected_tests).forEach(t => {
                    total += t.rate;
                    review_table.find('tbody').append(`<tr><td>${t.name}</td><td>${t.rate}</td></tr>`);
                });

                $(`<h3 style="margin-top: 20px; text-align: right;">Total: ${frappe.format(total, { fieldtype: 'Currency' })}</h3>`).appendTo(form_body);

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
                                    frappe.show_alert({ message: `Success. Invoice ${r.message.name} created.`, indicator: 'green' }, 7);
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
            container.html('<div class="alert alert-danger">No Lab Test selected.</div>');
            return;
        }
        let test_name = params.test_name;

        let form_wrapper = $('<div class="form-wrapper"></div>').appendTo(container);
        let header = $('<div class="form-header"></div>').appendTo(form_wrapper);
        let title_el = $('<h3>Enter Result - Step 1</h3>').appendTo(header);

        let step_display = $('<div class="step-display text-muted"></div>').appendTo(form_wrapper);
        let form_body = $('<div></div>').appendTo(form_wrapper);
        let action_area = $('<div class="form-actions" style="display: flex; justify-content: space-between;"></div>').appendTo(form_wrapper);

        let lab_test_doc = null;

        const steps = [
            { title: 'Overview', id: 'overview' },
            { title: 'Result Entry', id: 'results' },
            { title: 'Finalize', id: 'finish' }
        ];

        let render_step = (step_index) => {
            let step = steps[step_index];
            title_el.text(`Enter Result - ${step.title}`);
            step_display.html(`Step ${step_index + 1} of ${steps.length}`);
            form_body.empty();
            action_area.empty();

            if (step_index > 0) {
                $('<button class="btn btn-default">Previous</button>').appendTo(action_area).click(() => render_step(step_index - 1));
            } else { $('<div></div>').appendTo(action_area); }

            let next_btn = (label, fn) => $('<button class="btn btn-primary">' + label + '</button>').appendTo(action_area).click(fn);

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
                // Check for normal items
                if (lab_test_doc.normal_test_items && lab_test_doc.normal_test_items.length > 0) {
                    let table = $(`<table class="table table-bordered">
                        <thead><tr><th>Parameter</th><th>Result</th><th>Unit</th><th>Range</th></tr></thead>
                        <tbody></tbody>
                     </table>`).appendTo(form_body);

                    lab_test_doc.normal_test_items.forEach(item => {
                        let row = $('<tr></tr>').appendTo(table.find('tbody'));
                        $('<td>' + item.lab_test_name + '</td>').appendTo(row);
                        let input_td = $('<td></td>').appendTo(row);
                        let input = $(`<input type="text" class="form-control" value="${item.result_value || ''}">`).appendTo(input_td);

                        input.on('change', function () {
                            item.result_value = $(this).val();
                        });

                        $('<td>' + (item.unit || '') + '</td>').appendTo(row);
                        $('<td>' + (item.normal_range || '') + '</td>').appendTo(row);
                    });
                } else {
                    form_body.html('<div class="alert alert-warning">No structured parameters found. This might be a descriptive test.</div>');
                }

                next_btn('Next', () => render_step(step_index + 1));

            } else if (step.id === 'finish') {
                $('<h4>Review & Submit</h4>').appendTo(form_body);
                $('<p>Please verify results before submitting.</p>').appendTo(form_body);

                // Comments
                let comments = $(`<textarea class="form-control" placeholder="Technician Remarks" rows="3">${lab_test_doc.remarks || ''}</textarea>`).appendTo(form_body);
                comments.on('change', function () { lab_test_doc.remarks = $(this).val(); });

                let submit_btn = next_btn('Submit Results', () => {
                    submit_btn.prop('disabled', true);
                    // Save
                    lab_test_doc.status = 'Completed';
                    frappe.call({
                        method: 'frappe.client.save',
                        args: {
                            doc: lab_test_doc
                        },
                        callback: (r) => {
                            if (!r.exc) {
                                frappe.show_alert({ message: 'Lab Test Updated', indicator: 'green' });
                                this.page_manager.load_view({ id: 'patient_report' });
                            } else {
                                submit_btn.prop('disabled', false); // Re-enable on error
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