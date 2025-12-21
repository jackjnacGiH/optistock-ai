/**
 * Translation files for Thai (TH) and English (EN)
 */

export const translations = {
    th: {
        // Navigation
        nav: {
            dashboard: 'แดชบอร์ด',
            scan: 'สแกนและปรับสต็อก',
            history: 'ประวัติ',
            language: 'ภาษา'
        },

        // Dashboard
        dashboard: {
            title: 'แดชบอร์ด',
            subtitle: 'ภาพรวมสถานะสินค้าคงคลัง',
            totalProducts: 'สินค้าทั้งหมด',
            totalProductsSub: 'รายการที่ใช้งานอยู่',
            lowStockAlerts: 'แจ้งเตือนสินค้าใกล้หมด',
            lowStockAlertsSub: 'รายการที่ต้องเติมสต็อก',
            transactionsToday: 'ธุรกรรมวันนี้',
            transactionsTodaySub: '+4 จากเมื่อวาน',
            readyTitle: 'พร้อมจัดการสต็อกหรือยัง?',
            readyDesc: 'ใช้เครื่องสแกนเพื่อรับหรือจ่ายสินค้าอย่างรวดเร็ว ระบบจะอัปเดต Google Sheets แบบเรียลไทม์โดยอัตโนมัติ',
            startScanning: 'เริ่มสแกน'
        },

        // Scan Page
        scan: {
            title: 'สแกนสินค้า',
            subtitle: 'ชี้กล้องที่บาร์โค้ดหรือใส่ด้วยตนเอง',
            manualEntry: 'หรือใส่รหัสด้วยตนเอง',
            enterBarcode: 'ใส่รหัสบาร์โค้ด...',
            quickTip: 'เคล็ดลับ',
            quickTipText: 'ใส่ "รหัสสินค้า" เพื่อค้นหา',
            loading: 'กำลังค้นหาสินค้า...',
            backToScanner: 'กลับไปสแกน',
            adjustStock: 'ปรับสต็อก',
            receive: '+ รับเข้า (IN)',
            issue: '- จ่ายออก (OUT)',
            attachPhoto: 'แนบรูปภาพประกอบ (ไม่บังคับ)',
            confirm: 'ยืนยัน',
            productNotFound: 'ไม่พบสินค้าสำหรับบาร์โค้ด',
            errorFetching: 'เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า',
            stockUpdated: 'อัปเดตสต็อกสำเร็จ!',
            failedUpdate: 'ไม่สามารถอัปเดตสต็อกได้'
        },

        // History Page
        history: {
            title: 'ประวัติการเคลื่อนไหว',
            subtitle: 'รายการเคลื่อนไหวสต็อกล่าสุด',
            loading: 'กำลังโหลดประวัติ...',
            by: 'โดย',
            noHistory: 'ยังไม่มีประวัติการเคลื่อนไหว'
        },

        // Inventory Card
        inventory: {
            barcode: 'บาร์โค้ด',
            category: 'หมวดหมู่',
            currentStock: 'สต็อกปัจจุบัน',
            minStock: 'สต็อกขั้นต่ำ',
            price: 'ราคา',
            unit: 'หน่วย',
            lastUpdated: 'อัปเดตล่าสุด',
            location: 'ตำแหน่งเก็บ',
            shelf: 'ชั้น',
            row: 'แถว',
            aisle: 'ทาง'
        },

        // Common
        common: {
            loading: 'กำลังโหลด...',
            error: 'เกิดข้อผิดพลาด',
            success: 'สำเร็จ',
            cancel: 'ยกเลิก',
            save: 'บันทึก',
            delete: 'ลบ',
            edit: 'แก้ไข',
            search: 'ค้นหา',
            filter: 'กรอง',
            export: 'ส่งออก',
            import: 'นำเข้า'
        },

        // Barcode Print
        print: {
            title: 'พิมพ์สติ๊กเกอร์บาร์โค้ด',
            preview: 'ตัวอย่าง',
            settings: 'ตั้งค่าการพิมพ์',
            width: 'ความกว้าง (mm)',
            height: 'ความสูง (mm)',
            fontSize: 'ขนาดตัวอักษร',
            copies: 'จำนวนที่พิมพ์',
            showPrice: 'แสดงราคา',
            standardSizes: 'ขนาดสติ๊กเกอร์มาตรฐาน',
            productInfo: 'ข้อมูลสินค้า',
            barcode: 'บาร์โค้ด:',
            name: 'ชื่อ:',
            price: 'ราคา:',
            print: 'พิมพ์'
        }
    },

    en: {
        // Navigation
        nav: {
            dashboard: 'Dashboard',
            scan: 'Scan & Adjust',
            history: 'History',
            language: 'Language'
        },

        // Dashboard
        dashboard: {
            title: 'Dashboard',
            subtitle: 'Overview of your inventory status',
            totalProducts: 'Total Products',
            totalProductsSub: 'Active items in database',
            lowStockAlerts: 'Low Stock Alerts',
            lowStockAlertsSub: 'Items requiring attention',
            transactionsToday: 'Transactions Today',
            transactionsTodaySub: '+4 from yesterday',
            readyTitle: 'Ready to manage stock?',
            readyDesc: 'Use the scanner to quickly receive or issue items. The system will automatically update Google Sheets in real-time.',
            startScanning: 'Start Scanning'
        },

        // Scan Page
        scan: {
            title: 'Scan Product',
            subtitle: 'Point camera at barcode or enter manually',
            manualEntry: 'Or manually enter code',
            enterBarcode: 'Enter Barcode ID...',
            quickTip: 'Quick Tip',
            quickTipText: 'Enter "Product Code" to search',
            loading: 'Looking up product...',
            backToScanner: 'Back to Scanner',
            adjustStock: 'Adjust Stock',
            receive: '+ RECEIVE (IN)',
            issue: '- ISSUE (OUT)',
            attachPhoto: 'Attach proof photo (Optional)',
            confirm: 'CONFIRM',
            productNotFound: 'Product not found for barcode',
            errorFetching: 'Error fetching product',
            stockUpdated: 'Stock updated successfully!',
            failedUpdate: 'Failed to update stock'
        },

        // History Page
        history: {
            title: 'Transaction History',
            subtitle: 'Recent stock movements',
            loading: 'Loading history...',
            by: 'by',
            noHistory: 'No transaction history yet'
        },

        // Inventory Card
        inventory: {
            barcode: 'Barcode',
            category: 'Category',
            currentStock: 'Current Stock',
            minStock: 'Min Stock',
            price: 'Price',
            unit: 'Unit',
            lastUpdated: 'Last Updated',
            location: 'Location',
            shelf: 'Shelf',
            row: 'Row',
            aisle: 'Aisle'
        },

        // Common
        common: {
            loading: 'Loading...',
            error: 'Error',
            success: 'Success',
            cancel: 'Cancel',
            save: 'Save',
            delete: 'Delete',
            edit: 'Edit',
            search: 'Search',
            filter: 'Filter',
            export: 'Export',
            import: 'Import'
        },

        // Barcode Print
        print: {
            title: 'Print Barcode Label',
            preview: 'Preview',
            settings: 'Print Settings',
            width: 'Width (mm)',
            height: 'Height (mm)',
            fontSize: 'Font Size',
            copies: 'Copies',
            showPrice: 'Show Price',
            standardSizes: 'Standard Label Sizes',
            productInfo: 'Product Information',
            barcode: 'Barcode:',
            name: 'Name:',
            price: 'Price:',
            print: 'Print'
        }
    }
};

export default translations;
