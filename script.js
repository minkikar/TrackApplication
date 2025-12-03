
        // ===== APP STATE =====
        const STORAGE_KEY = 'track_your_jobs_data';
        let state = {
            jobs: [],
            hrs: [],
            lastUpdated: new Date().toISOString()
        };
        
        let editingJobId = null;
        let editingHrId = null;
        let currentView = 'dashboard';

        // ===== DOM ELEMENTS =====
        const elements = {
            // Views
            dashboardView: document.getElementById('dashboardView'),
            hrView: document.getElementById('hrView'),
            
            // Stats
            statTotal: document.getElementById('statTotal'),
            statApplied: document.getElementById('statApplied'),
            statInterview: document.getElementById('statInterview'),
            statOffers: document.getElementById('statOffers'),
            
            // Grids
            jobsGrid: document.getElementById('jobsGrid'),
            hrGrid: document.getElementById('hrGrid'),
            
            // Empty states
            emptyJobs: document.getElementById('emptyJobs'),
            emptyHR: document.getElementById('emptyHR'),
            
            // Filters
            searchInput: document.getElementById('searchInput'),
            statusFilter: document.getElementById('statusFilter'),
            
            // Buttons
            addJobBtn: document.getElementById('addJobBtn'),
            addHrBtn: document.getElementById('addHrBtn'),
            deleteAllBtn: document.getElementById('deleteAllBtn'),
            navAddJob: document.getElementById('navAddJob'),
            fabAddJob: document.getElementById('fabAddJob'),
            navExport: document.getElementById('navExport'),
            
            // Modals
            jobModal: document.getElementById('jobModal'),
            hrModal: document.getElementById('hrModal'),
            stepModal: document.getElementById('stepModal'),
            confirmModal: document.getElementById('confirmModal'),
            
            // Forms
            jobForm: document.getElementById('jobForm'),
            hrForm: document.getElementById('hrForm'),
            stepForm: document.getElementById('stepForm'),
            
            // Job form elements
            jobModalTitle: document.getElementById('jobModalTitle'),
            jobCompany: document.getElementById('jobCompany'),
            jobRole: document.getElementById('jobRole'),
            jobLink: document.getElementById('jobLink'),
            jobDate: document.getElementById('jobDate'),
            jobStatus: document.getElementById('jobStatus'),
            jobHr: document.getElementById('jobHr'),
            jobNotes: document.getElementById('jobNotes'),
            deleteJobBtn: document.getElementById('deleteJobBtn'),
            
            // HR form in job modal
            showHrForm: document.getElementById('showHrForm'),
            hrAddForm: document.getElementById('hrAddForm'),
            newHrName: document.getElementById('newHrName'),
            newHrCompany: document.getElementById('newHrCompany'),
            newHrRole: document.getElementById('newHrRole'),
            newHrEmail: document.getElementById('newHrEmail'),
            cancelHrForm: document.getElementById('cancelHrForm'),
            saveNewHr: document.getElementById('saveNewHr'),
            
            // HR modal elements
            hrName: document.getElementById('hrName'),
            hrRole: document.getElementById('hrRole'),
            hrCompany: document.getElementById('hrCompany'),
            hrEmail: document.getElementById('hrEmail'),
            
            // Step modal
            customStep: document.getElementById('customStep'),
            
            // Confirm modal
            confirmMessage: document.getElementById('confirmMessage'),
            confirmCancel: document.getElementById('confirmCancel'),
            confirmDelete: document.getElementById('confirmDelete')
        };

        // ===== UTILITY FUNCTIONS =====
        function saveState() {
            state.lastUpdated = new Date().toISOString();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        }

        function loadState() {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                state = JSON.parse(saved);
            }
        }

        function generateId() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        }

        function getInitials(text) {
            if (!text) return '?';
            return text
                .split(' ')
                .map(word => word[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();
        }

        function formatDate(dateStr) {
            if (!dateStr) return '';
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }

        function showToast(message, type = 'success') {
            const toast = document.createElement('div');
            toast.textContent = message;
            toast.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${type === 'error' ? '#ef4444' : '#10b981'};
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                animation: slideIn 0.3s ease;
            `;
            
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }, 3000);
            
            // Add animation styles if not present
            if (!document.querySelector('#toast-styles')) {
                const style = document.createElement('style');
                style.id = 'toast-styles';
                style.textContent = `
                    @keyframes slideIn {
                        from { transform: translateX(100%); opacity: 0; }
                        to { transform: translateX(0); opacity: 1; }
                    }
                    @keyframes slideOut {
                        from { transform: translateX(0); opacity: 1; }
                        to { transform: translateX(100%); opacity: 0; }
                    }
                `;
                document.head.appendChild(style);
            }
        }

        function showConfirm(message, onConfirm) {
            elements.confirmMessage.textContent = message;
            elements.confirmModal.classList.add('active');
            
            const confirmHandler = () => {
                elements.confirmModal.classList.remove('active');
                onConfirm();
                elements.confirmDelete.removeEventListener('click', confirmHandler);
            };
            
            elements.confirmDelete.addEventListener('click', confirmHandler);
            
            elements.confirmCancel.addEventListener('click', () => {
                elements.confirmModal.classList.remove('active');
                elements.confirmDelete.removeEventListener('click', confirmHandler);
            }, { once: true });
        }

        // ===== MODAL FUNCTIONS =====
        function openModal(type, data = null) {
            if (type === 'job') {
                editingJobId = data ? data.id : null;
                elements.jobModalTitle.textContent = data ? 'Edit Job' : 'Add Job';
                elements.deleteJobBtn.style.display = data ? 'block' : 'none';
                
                // Set today's date as default
                const today = new Date().toISOString().split('T')[0];
                elements.jobDate.value = today;
                
                if (data) {
                    elements.jobCompany.value = data.company || '';
                    elements.jobRole.value = data.role || '';
                    elements.jobLink.value = data.link || '';
                    elements.jobDate.value = data.date || today;
                    elements.jobStatus.value = data.status || 'Applied';
                    elements.jobNotes.value = data.notes || '';
                    elements.jobHr.value = data.hrId || '';
                } else {
                    elements.jobForm.reset();
                    elements.jobDate.value = today;
                }
                
                updateHrDropdown();
                elements.hrAddForm.classList.add('hidden');
                elements.jobModal.classList.add('active');
                
            } else if (type === 'hr') {
                editingHrId = data ? data.id : null;
                
                if (data) {
                    elements.hrName.value = data.name || '';
                    elements.hrRole.value = data.role || '';
                    elements.hrCompany.value = data.company || '';
                    elements.hrEmail.value = data.email || '';
                } else {
                    elements.hrForm.reset();
                }
                
                elements.hrModal.classList.add('active');
                
            } else if (type === 'step') {
                if (data) {
                    editingJobId = data.id;
                    // Pre-select current status
                    const radios = document.querySelectorAll('input[name="step"]');
                    radios.forEach(radio => {
                        radio.checked = radio.value === data.status;
                    });
                    elements.customStep.value = '';
                }
                elements.stepModal.classList.add('active');
            }
        }

        function closeModal(type) {
            if (type === 'job') {
                elements.jobModal.classList.remove('active');
                editingJobId = null;
            } else if (type === 'hr') {
                elements.hrModal.classList.remove('active');
                editingHrId = null;
            } else if (type === 'step') {
                elements.stepModal.classList.remove('active');
                editingJobId = null;
            } else if (type === 'confirm') {
                elements.confirmModal.classList.remove('active');
            }
        }

        // ===== HR DROPDOWN MANAGEMENT =====
        function updateHrDropdown() {
            elements.jobHr.innerHTML = '<option value="">No HR contact</option>';
            
            state.hrs.forEach(hr => {
                const option = document.createElement('option');
                option.value = hr.id;
                option.textContent = `${hr.name} - ${hr.company}`;
                elements.jobHr.appendChild(option);
            });
        }

        function toggleHrForm(show) {
            if (show) {
                elements.hrAddForm.classList.remove('hidden');
                // Enable inputs so browser validation will consider them focusable
                elements.newHrName.disabled = false;
                elements.newHrCompany.disabled = false;
                elements.newHrRole.disabled = false;
                elements.newHrEmail.disabled = false;

                elements.newHrName.focus();
                
                // Auto-fill company from job form
                const jobCompany = elements.jobCompany.value;
                if (jobCompany && !elements.newHrCompany.value) {
                    elements.newHrCompany.value = jobCompany;
                }
            } else {
                elements.hrAddForm.classList.add('hidden');

                // Clear and disable inputs to skip browser validation while hidden
                elements.newHrName.value = '';
                elements.newHrCompany.value = '';
                elements.newHrRole.value = '';
                elements.newHrEmail.value = '';

                elements.newHrName.disabled = true;
                elements.newHrCompany.disabled = true;
                elements.newHrRole.disabled = true;
                elements.newHrEmail.disabled = true;
            }
        }

        function saveNewHrFromJobForm() {
            const name = elements.newHrName.value.trim();
            const company = elements.newHrCompany.value.trim();
            
            if (!name || !company) {
                showToast('Please enter name and company', 'error');
                return;
            }
            
            const newHr = {
                id: generateId(),
                name: name,
                company: company,
                role: elements.newHrRole.value.trim() || 'Recruiter',
                email: elements.newHrEmail.value.trim(),
                createdAt: new Date().toISOString()
            };
            
            state.hrs.unshift(newHr);
            saveState();
            
            // Update dropdown and select new HR
            updateHrDropdown();
            elements.jobHr.value = newHr.id;
            
            // Hide form
            toggleHrForm(false);
            
            showToast('HR contact added');
        }

        // ===== JOB MANAGEMENT =====
        function saveJob(e) {
            e.preventDefault();
            
            const job = {
                id: editingJobId || generateId(),
                company: elements.jobCompany.value.trim(),
                role: elements.jobRole.value.trim(),
                link: elements.jobLink.value.trim(),
                date: elements.jobDate.value,
                status: elements.jobStatus.value,
                hrId: elements.jobHr.value || null,
                notes: elements.jobNotes.value.trim(),
                updatedAt: new Date().toISOString()
            };
            
            if (!job.company || !job.role) {
                showToast('Please enter company and role', 'error');
                return;
            }
            
            if (editingJobId) {
                // Update existing job
                const index = state.jobs.findIndex(j => j.id === editingJobId);
                state.jobs[index] = job;
                showToast('Job updated');
            } else {
                // Add new job
                job.createdAt = new Date().toISOString();
                state.jobs.unshift(job);
                showToast('Job added');
            }
            
            saveState();
            render();
            closeModal('job');
        }

        function deleteJob(jobId) {
            const job = state.jobs.find(j => j.id === jobId);
            if (!job) return;
            
            showConfirm(
                `Delete "${job.role}" at ${job.company}?`,
                () => {
                    state.jobs = state.jobs.filter(j => j.id !== jobId);
                    saveState();
                    render();
                    showToast('Job deleted');
                }
            );
        }

        function deleteJobFromModal() {
            if (!editingJobId) return;
            deleteJob(editingJobId);
            closeModal('job');
        }

        function deleteAllJobs() {
            if (state.jobs.length === 0) {
                showToast('No jobs to delete', 'error');
                return;
            }
            
            showConfirm(
                `Delete all ${state.jobs.length} jobs? This cannot be undone.`,
                () => {
                    state.jobs = [];
                    saveState();
                    render();
                    showToast('All jobs deleted');
                }
            );
        }

        function updateJobStatus(jobId, newStatus) {
            const index = state.jobs.findIndex(j => j.id === jobId);
            if (index !== -1) {
                state.jobs[index].status = newStatus;
                state.jobs[index].updatedAt = new Date().toISOString();
                saveState();
                render();
                showToast('Status updated');
            }
        }

        // ===== HR MANAGEMENT =====
        function saveHr(e) {
            e.preventDefault();
            
            const hr = {
                id: editingHrId || generateId(),
                name: elements.hrName.value.trim(),
                role: elements.hrRole.value.trim(),
                company: elements.hrCompany.value.trim(),
                email: elements.hrEmail.value.trim(),
                updatedAt: new Date().toISOString()
            };
            
            if (!hr.name || !hr.company) {
                showToast('Please enter name and company', 'error');
                return;
            }
            
            if (editingHrId) {
                // Update existing HR
                const index = state.hrs.findIndex(h => h.id === editingHrId);
                state.hrs[index] = hr;
                showToast('Contact updated');
            } else {
                // Add new HR
                hr.createdAt = new Date().toISOString();
                state.hrs.unshift(hr);
                showToast('Contact added');
            }
            
            saveState();
            render();
            closeModal('hr');
        }

        function deleteHr(hrId) {
            const hr = state.hrs.find(h => h.id === hrId);
            if (!hr) return;
            
            // Check if any jobs use this HR
            const jobsUsingHr = state.jobs.filter(j => j.hrId === hrId);
            
            let message = `Delete "${hr.name}" from ${hr.company}?`;
            if (jobsUsingHr.length > 0) {
                message += `\nThis contact is linked to ${jobsUsingHr.length} job(s).`;
            }
            
            showConfirm(message, () => {
                // Remove HR
                state.hrs = state.hrs.filter(h => h.id !== hrId);
                
                // Remove HR reference from jobs
                state.jobs.forEach(job => {
                    if (job.hrId === hrId) {
                        job.hrId = null;
                    }
                });
                
                saveState();
                render();
                showToast('Contact deleted');
            });
        }

        // ===== RENDERING =====
        function renderJobs() {
            const searchTerm = elements.searchInput.value.toLowerCase();
            const statusFilter = elements.statusFilter.value;
            
            let filteredJobs = state.jobs;
            
            // Apply search filter
            if (searchTerm) {
                filteredJobs = filteredJobs.filter(job =>
                    job.company.toLowerCase().includes(searchTerm) ||
                    job.role.toLowerCase().includes(searchTerm) ||
                    (job.notes && job.notes.toLowerCase().includes(searchTerm))
                );
            }
            
            // Apply status filter
            if (statusFilter !== 'all') {
                filteredJobs = filteredJobs.filter(job => job.status === statusFilter);
            }
            
            // Update empty state
            elements.emptyJobs.classList.toggle('hidden', filteredJobs.length > 0);
            elements.deleteAllBtn.style.display = state.jobs.length > 0 ? 'inline-flex' : 'none';
            
            // Render jobs
            elements.jobsGrid.innerHTML = '';
            
            filteredJobs.forEach(job => {
                const hr = job.hrId ? state.hrs.find(h => h.id === job.hrId) : null;
                
                const card = document.createElement('div');
                card.className = 'job-card';
                
                card.innerHTML = `
                    <div class="job-header">
                        <div class="company-logo">${getInitials(job.company)}</div>
                        <div class="job-info">
                            <div class="job-role">${escapeHtml(job.role)}</div>
                            <div class="job-company">${escapeHtml(job.company)}</div>
                            <div class="job-date">${formatDate(job.date)}</div>
                            <div class="status-badge status-${job.status.toLowerCase()}">${job.status}</div>
                        </div>
                    </div>
                    ${job.notes ? `<div class="job-notes">${escapeHtml(job.notes)}</div>` : ''}
                    ${hr ? `<div style="font-size: 13px; color: var(--muted);">Contact: ${hr.name}</div>` : ''}
                    <div class="job-actions">
                        <button class="btn btn-secondary btn-small" onclick="openModal('step', ${JSON.stringify(job).replace(/"/g, '&quot;')})">
                            Next Step
                        </button>
                        <button class="btn btn-secondary btn-small" onclick="openModal('job', ${JSON.stringify(job).replace(/"/g, '&quot;')})">
                            Edit
                        </button>
                        ${job.link ? `<button class="btn btn-secondary btn-small" onclick="window.open('${escapeHtml(job.link)}', '_blank')">Link</button>` : ''}
                        <button class="btn btn-secondary btn-small delete-btn" onclick="deleteJob('${job.id}')" style="color: #ef4444; border-color: #fee2e2;">
                            Delete
                        </button>
                    </div>
                `;
                
                elements.jobsGrid.appendChild(card);
            });
        }

        function renderHr() {
            elements.emptyHR.classList.toggle('hidden', state.hrs.length > 0);
            elements.hrGrid.innerHTML = '';
            
            state.hrs.forEach(hr => {
                const card = document.createElement('div');
                card.className = 'hr-card';
                
                card.innerHTML = `
                    <div class="hr-header">
                        <div class="hr-avatar">${getInitials(hr.name)}</div>
                        <div class="hr-info">
                            <div class="hr-name">${escapeHtml(hr.name)}</div>
                            <div class="hr-company">${escapeHtml(hr.company)}</div>
                            ${hr.role ? `<div style="font-size: 13px; color: var(--muted);">${escapeHtml(hr.role)}</div>` : ''}
                            ${hr.email ? `<div class="hr-email">${escapeHtml(hr.email)}</div>` : ''}
                        </div>
                    </div>
                    <div class="hr-actions">
                        <button class="btn btn-secondary btn-small" onclick="openModal('hr', ${JSON.stringify(hr).replace(/"/g, '&quot;')})">
                            Edit
                        </button>
                        <button class="btn btn-secondary btn-small delete-btn" onclick="deleteHr('${hr.id}')" style="color: #ef4444; border-color: #fee2e2;">
                            Delete
                        </button>
                    </div>
                `;
                
                elements.hrGrid.appendChild(card);
            });
        }

        function renderStats() {
            const total = state.jobs.length;
            const applied = state.jobs.filter(j => j.status === 'Applied').length;
            const interview = state.jobs.filter(j => j.status === 'Interview').length;
            const offers = state.jobs.filter(j => j.status === 'Offer').length;
            
            elements.statTotal.textContent = total;
            elements.statApplied.textContent = applied;
            elements.statInterview.textContent = interview;
            elements.statOffers.textContent = offers;
        }

        function render() {
            renderStats();
            if (currentView === 'dashboard') {
                renderJobs();
            } else if (currentView === 'hr') {
                renderHr();
            }
        }

        // ===== VIEW MANAGEMENT =====
        function showView(view) {
            currentView = view;
            
            // Hide all views
            elements.dashboardView.classList.add('hidden');
            elements.hrView.classList.add('hidden');
            
            // Show selected view
            if (view === 'dashboard') {
                elements.dashboardView.classList.remove('hidden');
                renderJobs();
            } else if (view === 'hr') {
                elements.hrView.classList.remove('hidden');
                renderHr();
            }
            
            // Update nav buttons
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelector(`.nav-btn[data-view="${view}"]`)?.classList.add('active');
        }

        // ===== EXPORT FUNCTION =====
        function exportData() {
            if (state.jobs.length === 0) {
                showToast('No data to export', 'error');
                return;
            }
            
            const headers = ['Company', 'Role', 'Status', 'Date', 'Link', 'HR Contact', 'Notes'];
            const rows = state.jobs.map(job => {
                const hr = job.hrId ? state.hrs.find(h => h.id === job.hrId) : null;
                return [
                    escapeCsv(job.company),
                    escapeCsv(job.role),
                    escapeCsv(job.status),
                    escapeCsv(job.date),
                    escapeCsv(job.link),
                    escapeCsv(hr ? `${hr.name} (${hr.company})` : ''),
                    escapeCsv(job.notes)
                ];
            });
            
            const csvContent = [headers, ...rows]
                .map(row => row.join(','))
                .join('\n');
            
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `track-your-jobs-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            
            showToast('Data exported as CSV');
        }

        function escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        function escapeCsv(text) {
            if (text == null) return '';
            const string = String(text);
            if (string.includes(',') || string.includes('"') || string.includes('\n')) {
                return '"' + string.replace(/"/g, '""') + '"';
            }
            return string;
        }

        // ===== EVENT LISTENERS =====
        function setupEventListeners() {
            // View navigation
            document.querySelectorAll('.nav-btn[data-view]').forEach(btn => {
                btn.addEventListener('click', () => {
                    showView(btn.dataset.view);
                });
            });
            
            // Add job buttons
            elements.addJobBtn.addEventListener('click', () => openModal('job'));
            elements.navAddJob.addEventListener('click', () => openModal('job'));
            elements.fabAddJob.addEventListener('click', () => openModal('job'));
            
            // Add HR button
            elements.addHrBtn.addEventListener('click', () => openModal('hr'));
            
            // Export button
            elements.navExport.addEventListener('click', exportData);
            
            // Delete all button
            elements.deleteAllBtn.addEventListener('click', deleteAllJobs);
            
            // Search and filter
            elements.searchInput.addEventListener('input', renderJobs);
            elements.statusFilter.addEventListener('change', renderJobs);
            
            // Form submissions
            elements.jobForm.addEventListener('submit', saveJob);
            elements.hrForm.addEventListener('submit', saveHr);
            elements.stepForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(elements.stepForm);
                let newStatus = formData.get('step');
                
                if (!newStatus && elements.customStep.value.trim()) {
                    newStatus = elements.customStep.value.trim();
                }
                
                if (!newStatus) {
                    showToast('Please select or enter a status', 'error');
                    return;
                }
                
                updateJobStatus(editingJobId, newStatus);
                closeModal('step');
            });
            
            // Modal close buttons
            document.getElementById('cancelJob').addEventListener('click', () => closeModal('job'));
            document.getElementById('cancelHr').addEventListener('click', () => closeModal('hr'));
            document.getElementById('cancelStep').addEventListener('click', () => closeModal('step'));
            elements.confirmCancel.addEventListener('click', () => closeModal('confirm'));
            
            // Delete job from modal
            elements.deleteJobBtn.addEventListener('click', deleteJobFromModal);
            
            // HR form in job modal
            elements.showHrForm.addEventListener('click', () => toggleHrForm(true));
            elements.cancelHrForm.addEventListener('click', () => toggleHrForm(false));
            elements.saveNewHr.addEventListener('click', saveNewHrFromJobForm);
            
            // Close modals on overlay click
            document.querySelectorAll('.modal').forEach(modal => {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        const type = modal.id === 'jobModal' ? 'job' :
                                    modal.id === 'hrModal' ? 'hr' :
                                    modal.id === 'stepModal' ? 'step' :
                                    modal.id === 'confirmModal' ? 'confirm' : null;
                        if (type) closeModal(type);
                    }
                });
            });
            
            // Close modals on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    closeModal('job');
                    closeModal('hr');
                    closeModal('step');
                    closeModal('confirm');
                }
            });
            
            // Set today's date as default
            const today = new Date().toISOString().split('T')[0];
            elements.jobDate.value = today;
        }

        // ===== INITIALIZATION =====
        function init() {
            loadState();
            
            // Add some sample data if empty (optional)
            if (state.jobs.length === 0 && state.hrs.length === 0) {
                // Remove or keep this based on preference
                // loadSampleData();
            }
            
            setupEventListeners();
            render();
            
            // Set initial view
            showView('dashboard');
        }

        // ===== SAMPLE DATA (Optional) =====
        function loadSampleData() {
            const sampleHrs = [
                {
                    id: generateId(),
                    name: 'Priya Sharma',
                    role: 'Recruiter',
                    company: 'TechCorp',
                    email: 'priya@techcorp.com',
                    createdAt: new Date().toISOString()
                },
                {
                    id: generateId(),
                    name: 'Alex Chen',
                    role: 'HR Manager',
                    company: 'InnovateLabs',
                    email: 'alex@innovatelabs.com',
                    createdAt: new Date().toISOString()
                }
            ];
            
            const sampleJobs = [
                {
                    id: generateId(),
                    company: 'TechCorp',
                    role: 'Frontend Developer',
                    link: 'https://techcorp.com/careers',
                    date: new Date().toISOString().split('T')[0],
                    status: 'Applied',
                    hrId: sampleHrs[0].id,
                    notes: 'Applied via LinkedIn. Follow up in 1 week.',
                    createdAt: new Date().toISOString()
                },
                {
                    id: generateId(),
                    company: 'InnovateLabs',
                    role: 'Full Stack Engineer',
                    link: 'https://innovatelabs.com/jobs',
                    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
                    status: 'Interview',
                    hrId: sampleHrs[1].id,
                    notes: 'Technical interview scheduled for Friday 2 PM.',
                    createdAt: new Date().toISOString()
                }
            ];
            
            state.hrs = sampleHrs;
            state.jobs = sampleJobs;
            saveState();
        }

        // ===== START APP =====
        document.addEventListener('DOMContentLoaded', init);
   