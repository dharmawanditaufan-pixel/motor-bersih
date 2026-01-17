/**
 * Member Management Module
 * Handles CRUD operations for customer members with loyalty program
 */

class MemberManager {
    constructor() {
        this.apiClient = new APIClient();
        this.members = [];
        this.filteredMembers = [];
        this.init();
    }

    init() {
        // Check auth
        const auth = window.authManager || window.AuthManager?.getInstance?.();
        if (auth && !auth.checkAuth()) {
            return;
        }

        this.loadMembers();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterMembers(e.target.value));
        }

        // Form submit
        const memberForm = document.getElementById('memberForm');
        if (memberForm) {
            memberForm.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Photo upload preview
        const platePhoto = document.getElementById('platePhoto');
        if (platePhoto) {
            platePhoto.addEventListener('change', (e) => this.previewPhoto(e));
        }
    }

    async loadMembers() {
        try {
            const response = await this.apiClient.get('/customers');
            
            if (response.success) {
                this.members = response.data || [];
                this.filteredMembers = [...this.members];
                this.renderMembers();
                this.updateStats();
            } else {
                this.showError('Gagal memuat data member');
            }
        } catch (error) {
            console.error('Error loading members:', error);
            this.showError('Gagal memuat data member: ' + error.message);
        }
    }

    filterMembers(query) {
        const q = query.toLowerCase().trim();
        
        if (!q) {
            this.filteredMembers = [...this.members];
        } else {
            this.filteredMembers = this.members.filter(member => 
                member.name.toLowerCase().includes(q) ||
                member.license_plate.toLowerCase().includes(q) ||
                (member.whatsapp_number && member.whatsapp_number.includes(q)) ||
                (member.phone && member.phone.includes(q)) ||
                (member.motorcycle_brand && member.motorcycle_brand.toLowerCase().includes(q))
            );
        }
        
        this.renderMembers();
    }

    renderMembers() {
        const tbody = document.getElementById('membersTableBody');
        if (!tbody) return;

        if (this.filteredMembers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="px-6 py-12 text-center text-gray-500">
                        <i class="fas fa-users text-4xl mb-3 block"></i>
                        <p>Tidak ada data member</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.filteredMembers.map(member => this.renderMemberRow(member)).join('');
    }

    renderMemberRow(member) {
        const motorTypeLabel = {
            'motor_kecil': 'Motor Kecil',
            'motor_sedang': 'Motor Sedang',
            'motor_besar': 'Motor Besar'
        };

        const motorTypeColor = {
            'motor_kecil': 'bg-blue-100 text-blue-800',
            'motor_sedang': 'bg-green-100 text-green-800',
            'motor_besar': 'bg-purple-100 text-purple-800'
        };

        const loyaltyProgress = (member.loyalty_count || 0) % 5;
        const loyaltyBar = Array(5).fill(0).map((_, i) => 
            i < loyaltyProgress ? '🟢' : '⚪'
        ).join('');

        const hasFreeWash = (member.loyalty_count || 0) >= 5;

        return `
            <tr class="hover:bg-gray-50 transition">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-purple-100 rounded-lg">
                            <i class="fas fa-motorcycle text-purple-600"></i>
                        </div>
                        <div class="ml-3">
                            <div class="text-sm font-medium text-gray-900">${member.license_plate}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${member.name}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${member.whatsapp_number || '-'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${motorTypeColor[member.motorcycle_type] || 'bg-gray-100 text-gray-800'}">
                        ${motorTypeLabel[member.motorcycle_type] || member.motorcycle_type}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${member.motorcycle_brand || '-'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm">
                        <div class="flex items-center gap-1">
                            ${loyaltyBar}
                        </div>
                        <p class="text-xs text-gray-500 mt-1">${loyaltyProgress}/5 cuci</p>
                        ${hasFreeWash ? '<p class="text-xs text-green-600 font-semibold mt-1">🎁 Gratis cuci!</p>' : ''}
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${member.is_member ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                        ${member.is_member ? '✓ Member' : 'Non-Member'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex items-center gap-2">
                        <button 
                            onclick="memberManager.editMember(${member.id})"
                            class="text-blue-600 hover:text-blue-900 transition">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button 
                            onclick="memberManager.deleteMember(${member.id}, '${member.name}')"
                            class="text-red-600 hover:text-red-900 transition">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button 
                            onclick="memberManager.sendWhatsApp('${member.whatsapp_number}', '${member.name}')"
                            class="text-green-600 hover:text-green-900 transition">
                            <i class="fab fa-whatsapp"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    updateStats() {
        const totalMembers = this.members.length;
        const activeMembers = this.members.filter(m => m.is_member).length;
        const loyaltyRewards = this.members.filter(m => (m.loyalty_count || 0) >= 5).length;
        const motorKecil = this.members.filter(m => m.motorcycle_type === 'motor_kecil').length;

        document.getElementById('totalMembers').textContent = totalMembers;
        document.getElementById('activeMembers').textContent = activeMembers;
        document.getElementById('loyaltyRewards').textContent = loyaltyRewards;
        document.getElementById('motorKecil').textContent = motorKecil;
    }

    async handleSubmit(e) {
        e.preventDefault();

        const memberId = document.getElementById('memberId').value;
        const memberData = {
            name: document.getElementById('memberName').value,
            license_plate: document.getElementById('memberPlate').value.toUpperCase(),
            whatsapp_number: document.getElementById('memberWhatsApp').value,
            phone: document.getElementById('memberPhone').value || null,
            motorcycle_type: document.getElementById('motorType').value,
            motorcycle_brand: document.getElementById('motorBrand').value,
            is_member: document.getElementById('isMember').checked ? 1 : 0
        };

        try {
            let response;
            if (memberId) {
                // Update existing member
                response = await this.apiClient.put(`/customers/${memberId}`, memberData);
            } else {
                // Create new member
                response = await this.apiClient.post('/customers', memberData);
            }

            if (response.success) {
                this.showSuccess(memberId ? 'Member berhasil diupdate!' : 'Member berhasil ditambahkan!');
                closeModal();
                this.loadMembers();
            } else {
                this.showError(response.message || 'Gagal menyimpan data member');
            }
        } catch (error) {
            console.error('Error saving member:', error);
            this.showError('Gagal menyimpan data member: ' + error.message);
        }
    }

    editMember(id) {
        const member = this.members.find(m => m.id === id);
        if (!member) return;

        document.getElementById('modalTitle').textContent = 'Edit Member';
        document.getElementById('memberId').value = member.id;
        document.getElementById('memberName').value = member.name;
        document.getElementById('memberPlate').value = member.license_plate;
        document.getElementById('memberWhatsApp').value = member.whatsapp_number || '';
        document.getElementById('memberPhone').value = member.phone || '';
        document.getElementById('motorType').value = member.motorcycle_type;
        document.getElementById('motorBrand').value = member.motorcycle_brand || '';
        document.getElementById('isMember').checked = member.is_member;

        openAddModal();
    }

    async deleteMember(id, name) {
        if (!confirm(`Hapus member "${name}"?\nData transaksi akan tetap tersimpan.`)) {
            return;
        }

        try {
            const response = await this.apiClient.delete(`/customers/${id}`);
            
            if (response.success) {
                this.showSuccess('Member berhasil dihapus!');
                this.loadMembers();
            } else {
                this.showError(response.message || 'Gagal menghapus member');
            }
        } catch (error) {
            console.error('Error deleting member:', error);
            this.showError('Gagal menghapus member: ' + error.message);
        }
    }

    sendWhatsApp(number, name) {
        if (!number) {
            this.showError('Nomor WhatsApp tidak tersedia');
            return;
        }

        const message = encodeURIComponent(`Halo ${name}, terima kasih telah menjadi member Motor Bersih! 🏍️✨`);
        const url = `https://wa.me/${number.replace(/^0/, '62')}?text=${message}`;
        window.open(url, '_blank');
    }

    previewPhoto(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const preview = document.getElementById('photoPreview');
            const previewImage = document.getElementById('previewImage');
            
            previewImage.src = event.target.result;
            preview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }

    showSuccess(message) {
        // Simple alert for now, can be replaced with toast notification
        alert('✅ ' + message);
    }

    showError(message) {
        alert('❌ ' + message);
    }
}

// Modal functions
function openAddModal() {
    document.getElementById('modalTitle').textContent = 'Tambah Member Baru';
    document.getElementById('memberForm').reset();
    document.getElementById('memberId').value = '';
    document.getElementById('photoPreview').classList.add('hidden');
    document.getElementById('memberModal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('memberModal').classList.add('hidden');
}

// Initialize member manager
let memberManager;
document.addEventListener('DOMContentLoaded', () => {
    memberManager = new MemberManager();
});
