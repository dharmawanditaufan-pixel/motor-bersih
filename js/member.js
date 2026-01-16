/**
 * Member management and notifications module
 */

class MemberManager {
    constructor() {
        this.FREE_WASH_AFTER = 5; // Free wash after 5 washes
        this.members = this.loadMembers();
    }
    
    loadMembers() {
        // Load members from localStorage or API
        try {
            const membersData = localStorage.getItem('motowash_members');
            return membersData ? JSON.parse(membersData) : [];
        } catch (error) {
            console.error('Error loading members:', error);
            return [];
        }
    }
    
    saveMembers() {
        try {
            localStorage.setItem('motowash_members', JSON.stringify(this.members));
            return true;
        } catch (error) {
            console.error('Error saving members:', error);
            return false;
        }
    }
    
    findMember(licensePlate, phoneNumber = null) {
        // Find member by license plate or phone number
        return this.members.find(member => 
            member.licensePlate === licensePlate || 
            (phoneNumber && member.phone === phoneNumber)
        );
    }
    
    registerMember(data) {
        const {
            name,
            phone,
            licensePlate,
            motorcycleType,
            email = ''
        } = data;
        
        // Check if member already exists
        const existingMember = this.findMember(licensePlate, phone);
        if (existingMember) {
            return {
                success: false,
                message: 'Member sudah terdaftar',
                member: existingMember
            };
        }
        
        // Create new member
        const newMember = {
            id: this.generateMemberId(),
            name,
            phone: this.formatPhoneNumber(phone),
            licensePlate: licensePlate.toUpperCase(),
            motorcycleType,
            email,
            isActive: true,
            joinDate: new Date().toISOString(),
            washCount: 0,
            totalSpent: 0,
            freeWashAvailable: false,
            lastVisit: null,
            notifications: {
                whatsapp: true,
                email: !!email,
                sms: false
            }
        };
        
        this.members.push(newMember);
        this.saveMembers();
        
        // Send welcome notification
        this.sendWelcomeNotification(newMember);
        
        return {
            success: true,
            message: 'Member berhasil didaftarkan',
            member: newMember
        };
    }
    
    recordWash(memberId, amount, isFreeWash = false) {
        const member = this.members.find(m => m.id === memberId);
        if (!member) {
            return { success: false, message: 'Member tidak ditemukan' };
        }
        
        // Update member data
        member.washCount += 1;
        if (!isFreeWash) {
            member.totalSpent += amount;
        }
        member.lastVisit = new Date().toISOString();
        
        // Check for free wash eligibility
        if (member.washCount % this.FREE_WASH_AFTER === 0) {
            member.freeWashAvailable = true;
        }
        
        this.saveMembers();
        
        // Send notification
        this.sendWashNotification(member, amount, isFreeWash);
        
        return {
            success: true,
            message: 'Data cuci berhasil dicatat',
            member,
            nextFreeWash: this.calculateNextFreeWash(member.washCount)
        };
    }
    
    calculateNextFreeWash(currentCount) {
        const washesUntilFree = this.FREE_WASH_AFTER - (currentCount % this.FREE_WASH_AFTER);
        return {
            washesNeeded: washesUntilFree,
            nextFreeAt: currentCount + washesUntilFree
        };
    }
    
    sendWelcomeNotification(member) {
        const message = this.generateWelcomeMessage(member);
        
        // Send via WhatsApp if enabled
        if (member.notifications.whatsapp) {
            this.sendWhatsAppNotification(member.phone, message);
        }
        
        // Send via email if enabled
        if (member.notifications.email && member.email) {
            this.sendEmailNotification(member.email, 'Selamat Bergabung di MotoWash!', message);
        }
        
        console.log('Welcome notification sent to:', member.name);
    }
    
    sendWashNotification(member, amount, isFreeWash) {
        const message = this.generateWashMessage(member, amount, isFreeWash);
        
        // Send via WhatsApp if enabled
        if (member.notifications.whatsapp) {
            this.sendWhatsAppNotification(member.phone, message);
        }
        
        // Send free wash notification if eligible
        if (member.freeWashAvailable) {
            this.sendFreeWashNotification(member);
        }
        
        console.log('Wash notification sent to:', member.name);
    }
    
    sendFreeWashNotification(member) {
        const message = this.generateFreeWashMessage(member);
        
        if (member.notifications.whatsapp) {
            this.sendWhatsAppNotification(member.phone, message);
        }
        
        if (member.notifications.email && member.email) {
            this.sendEmailNotification(member.email, '🎉 Cuci Gratis dari MotoWash!', message);
        }
        
        console.log('Free wash notification sent to:', member.name);
    }
    
    generateWelcomeMessage(member) {
        return `Halo ${member.name}!\n\n` +
               `Selamat bergabung sebagai member MotoWash! 🎉\n\n` +
               `📋 *Data Member Anda:*\n` +
               `• Nama: ${member.name}\n` +
               `• Plat Nomor: ${member.licensePlate}\n` +
               `• Jenis Motor: ${member.motorcycleType}\n\n` +
               `🎁 *Keuntungan Member:*\n` +
               `• Notifikasi WhatsApp setiap transaksi\n` +
               `• 1x CUCI GRATIS setiap 5x cuci\n` +
               `• Prioritas antrian\n` +
               `• Diskon spesial periode tertentu\n\n` +
               `Terima kasih telah memilih MotoWash!\n` +
               `Sampai jumpa di cucian berikutnya! 🏍️💨\n\n` +
               `*MotoWash - Cuci Motor Professional*`;
    }
    
    generateWashMessage(member, amount, isFreeWash) {
        const nextFree = this.calculateNextFreeWash(member.washCount);
        
        let message = `Halo ${member.name}!\n\n` +
                     `Terima kasih telah menggunakan layanan MotoWash.\n\n` +
                     `📋 *Rincian Transaksi:*\n` +
                     `• Cuci ke-${member.washCount}\n` +
                     `• Plat: ${member.licensePlate}\n`;
        
        if (isFreeWash) {
            message += `• *CUCI GRATIS!* 🎉\n\n`;
        } else {
            message += `• Total: Rp ${amount.toLocaleString('id-ID')}\n\n`;
        }
        
        message += `🎯 *Status Poin Member:*\n` +
                  `• Total cuci: ${member.washCount}x\n`;
        
        if (member.freeWashAvailable) {
            message += `• *SELAMAT!* Anda dapat 1x cuci gratis!\n\n`;
        } else {
            message += `• Sisa ${nextFree.washesNeeded} cuci lagi untuk dapat GRATIS!\n\n`;
        }
        
        message += `Terima kasih & sampai jumpa lagi!\n` +
                  `*MotoWash - Cuci Motor Professional*`;
        
        return message;
    }
    
    generateFreeWashMessage(member) {
        return `🎉 *SELAMAT ${member.name.toUpperCase()}!* 🎉\n\n` +
               `Anda telah mencapai ${member.washCount}x cuci di MotoWash!\n\n` +
               `🎁 *HADIAH SPESIAL UNTUK ANDA:*\n` +
               `1x CUCI MOTOR GRATIS! 🏍️✨\n\n` +
               `*Syarat & Ketentuan:*\n` +
               `• Berlaku untuk semua jenis cuci\n` +
               `• Tidak termasuk layanan tambahan\n` +
               `• Berlaku 30 hari dari tanggal notifikasi\n` +
               `• Dapat digunakan pada kunjungan berikutnya\n\n` +
               `Ayo gunakan hak cuci gratis Anda sekarang!\n\n` +
               `Terima kasih telah menjadi member setia MotoWash!\n` +
               `*MotoWash - Cuci Motor Professional*`;
    }
    
    async sendWhatsAppNotification(phone, message) {
        // In production, integrate with WhatsApp Business API
        // For demo, log to console
        
        try {
            const formattedPhone = this.formatPhoneNumber(phone);
            console.log('WhatsApp would be sent to:', formattedPhone);
            console.log('Message:', message);
            
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            return { success: true, message: 'WhatsApp notification queued' };
            
        } catch (error) {
            console.error('Error sending WhatsApp:', error);
            return { success: false, message: 'Failed to send WhatsApp' };
        }
    }
    
    async sendEmailNotification(email, subject, message) {
        // In production, integrate with email service
        // For demo, log to console
        
        try {
            console.log('Email would be sent to:', email);
            console.log('Subject:', subject);
            console.log('Message:', message);
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            return { success: true, message: 'Email notification queued' };
            
        } catch (error) {
            console.error('Error sending email:', error);
            return { success: false, message: 'Failed to send email' };
        }
    }
    
    formatPhoneNumber(phone) {
        let cleaned = phone.replace(/\D/g, '');
        
        if (cleaned.startsWith('0')) {
            cleaned = '62' + cleaned.substring(1);
        } else if (cleaned.startsWith('8')) {
            cleaned = '62' + cleaned;
        }
        
        return cleaned;
    }
    
    generateMemberId() {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substr(2, 4).toUpperCase();
        return `MEM${timestamp}${random}`;
    }
    
    getMemberStats() {
        const totalMembers = this.members.length;
        const activeMembers = this.members.filter(m => m.isActive).length;
        const membersWithFreeWash = this.members.filter(m => m.freeWashAvailable).length;
        const totalWashes = this.members.reduce((sum, m) => sum + m.washCount, 0);
        const totalRevenue = this.members.reduce((sum, m) => sum + m.totalSpent, 0);
        
        return {
            totalMembers,
            activeMembers,
            membersWithFreeWash,
            totalWashes,
            totalRevenue,
            averageWashesPerMember: totalMembers > 0 ? (totalWashes / totalMembers).toFixed(1) : 0
        };
    }
    
    getRecentMembers(limit = 10) {
        return [...this.members]
            .sort((a, b) => new Date(b.joinDate) - new Date(a.joinDate))
            .slice(0, limit);
    }
    
    getTopMembers(limit = 5) {
        return [...this.members]
            .sort((a, b) => b.washCount - a.washCount)
            .slice(0, limit);
    }
    
    updateMemberNotifications(memberId, notificationSettings) {
        const member = this.members.find(m => m.id === memberId);
        if (!member) {
            return { success: false, message: 'Member tidak ditemukan' };
        }
        
        member.notifications = {
            ...member.notifications,
            ...notificationSettings
        };
        
        this.saveMembers();
        
        return { success: true, message: 'Pengaturan notifikasi diperbarui', member };
    }
    
    deactivateMember(memberId) {
        const member = this.members.find(m => m.id === memberId);
        if (!member) {
            return { success: false, message: 'Member tidak ditemukan' };
        }
        
        member.isActive = false;
        member.deactivatedAt = new Date().toISOString();
        this.saveMembers();
        
        return { success: true, message: 'Member dinonaktifkan', member };
    }
    
    reactivateMember(memberId) {
        const member = this.members.find(m => m.id === memberId);
        if (!member) {
            return { success: false, message: 'Member tidak ditemukan' };
        }
        
        member.isActive = true;
        member.reactivatedAt = new Date().toISOString();
        this.saveMembers();
        
        return { success: true, message: 'Member diaktifkan kembali', member };
    }
    
    searchMembers(query) {
        const searchTerm = query.toLowerCase();
        
        return this.members.filter(member => 
            member.name.toLowerCase().includes(searchTerm) ||
            member.licensePlate.toLowerCase().includes(searchTerm) ||
            member.phone.includes(searchTerm) ||
            member.email?.toLowerCase().includes(searchTerm)
        );
    }
    
    exportMembersToCSV() {
        if (this.members.length === 0) {
            return '';
        }
        
        const headers = ['ID', 'Nama', 'Telepon', 'Plat Nomor', 'Jenis Motor', 'Email', 'Tanggal Bergabung', 'Total Cuci', 'Total Belanja', 'Status', 'Cuci Gratis Tersedia'];
        
        const rows = this.members.map(member => [
            member.id,
            member.name,
            member.phone,
            member.licensePlate,
            member.motorcycleType,
            member.email || '',
            new Date(member.joinDate).toLocaleDateString('id-ID'),
            member.washCount,
            member.totalSpent.toLocaleString('id-ID'),
            member.isActive ? 'Aktif' : 'Tidak Aktif',
            member.freeWashAvailable ? 'Ya' : 'Tidak'
        ]);
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        
        return csvContent;
    }
    
    downloadMembersCSV() {
        const csvContent = this.exportMembersToCSV();
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `members_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }
}

// Initialize member manager
let memberManager = null;

function initMemberManager() {
    if (!memberManager) {
        memberManager = new MemberManager();
    }
    return memberManager;
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.MemberManager = MemberManager;
    window.initMemberManager = initMemberManager;
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MemberManager,
        initMemberManager
    };
}

// Demo initialization
document.addEventListener('DOMContentLoaded', function() {
    // Initialize member manager if on a page that needs it
    if (document.querySelector('[data-member-feature]')) {
        initMemberManager();
        
        // Add demo data if empty
        if (memberManager.members.length === 0) {
            memberManager.registerMember({
                name: 'Andi Wijaya',
                phone: '081234567892',
                licensePlate: 'B 1234 ABC',
                motorcycleType: 'Honda Beat',
                email: 'andi@example.com'
            });
            
            memberManager.registerMember({
                name: 'Siti Rahma',
                phone: '081234567893',
                licensePlate: 'B 5678 XYZ',
                motorcycleType: 'Yamaha NMAX'
            });
            
            // Add some wash history
            memberManager.recordWash(memberManager.members[0].id, 25000);
            memberManager.recordWash(memberManager.members[0].id, 35000);
            memberManager.recordWash(memberManager.members[0].id, 25000);
            memberManager.recordWash(memberManager.members[1].id, 30000);
        }
    }
});