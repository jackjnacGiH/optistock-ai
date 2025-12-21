export const mockInventory = [
    {
        id: "1",
        barcode: "8850123456789",
        name: "น้ำดื่ม Crystal 600ml",
        stock: 150,
        unit: "ขวด",
        minStock: 20,
        imageUrl: "https://images.unsplash.com/photo-1602143407151-11115cd4e69b?auto=format&fit=crop&q=80&w=300",
        lastOut: "2023-10-25"
    },
    {
        id: "2",
        barcode: "8850987654321",
        name: "Lays Classic 50g",
        stock: 45,
        unit: "ซอง",
        minStock: 50,
        imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&q=80&w=300",
        lastOut: "2023-11-01"
    },
    {
        id: "3",
        barcode: "1234567890123",
        name: "Coca Cola 325ml",
        stock: 12,
        unit: "กระป๋อง",
        minStock: 24,
        imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=300",
        lastOut: "2023-11-05"
    }
];

export const mockHistory = [
    {
        id: "t1",
        date: "2023-11-05T10:30:00Z",
        barcode: "8850123456789",
        productName: "น้ำดื่ม Crystal 600ml",
        type: "IN",
        amount: 100,
        userId: "Admin"
    },
    {
        id: "t2",
        date: "2023-11-05T14:15:00Z",
        barcode: "1234567890123",
        productName: "Coca Cola 325ml",
        type: "OUT",
        amount: 5,
        userId: "User1"
    }
];
