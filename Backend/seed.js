const mongoose = require("mongoose");
const Product = require("./models/productModel");
const { MONGO_URI } = require("./config/config");

const sampleProducts = [{
    name: "AMD RYZEN 9-9950X3D2 Dual Edition Box",
    price: "57499 EGP",
    quantity: 25,
    description: "16-core, 32-thread Ryzen 9 9950X3D desktop processor based on the Ryzen 9000 Series for the AM5 platform, featuring 209.25 MB total cache with AMD 3D V-Cache technology, a 4.3 GHz base clock and up to 5.6 GHz boost clock, DDR5 memory support, PCIe 5.0 connectivity, integrated AMD Radeon Graphics, and an unlocked multiplier for enthusiast gaming, content creation, and overclocking.",
    category: "CPU",
},
{
    name: "ASUS TUF Gaming GeForce RTX 5090 32GB GDDR7",
    price: "211000 EGP",
    quantity: 5,
    description: "NVIDIA GeForce RTX 5090 graphics card with 32 GB GDDR7 memory, 21,760 CUDA cores, a 2437 MHz boost clock, PCIe 5.0 support, triple-fan cooling, quad-slot TUF Gaming design, HDMI 2.1b and DisplayPort 2.1b outputs, AI performance up to 3352 TOPS, and 8K display support for ultra-high-end gaming, AI, and professional creative workloads.",
    category: "GPU",
},
{
    name: "AMD Ryzen 7 9800X3D: 8C/16T, 4.7GHz Base, 5.2GHz Boost, 96MB L3 Cache, 120W TDP, AM5, DDR5, PCIe 5.0, Radeon iGPU (2C, 2200MHz)",
    price: "24999 EGP",
    quantity: 30,
    description: "8-core, 16-thread Ryzen 7 9800X3D desktop processor featuring AMD 3D V-Cache technology, a 4.7 GHz base clock and up to 5.2 GHz boost clock, 96 MB cache, DDR5 and PCIe 5.0 support, integrated AMD Radeon Graphics, and an unlocked multiplier for high-performance gaming and demanding multitasking.",
    category: "CPU",
},
{
    name: "PNY GeForce RTX 5080 OC Triple Fan Blackwell Architecture 16GB GDDR7",
    price: "74999 EGP",
    quantity: 10,
    description: "NVIDIA GeForce RTX 5080 graphics card based on the Blackwell architecture, featuring 16 GB GDDR7 memory, 10,752 CUDA cores, a boost clock of up to 2.73 GHz, PCIe 5.0 support, triple-fan cooling, and DirectX 12 Ultimate compatibility for 4K gaming, AI acceleration, and high-performance creative workloads.",
    category: "GPU",
},
{
    name: "CORSAIR Vengeance DDR5 RAM 32GB (2x16GB) 6000MHz CL38 Intel XMP iCUE Compatible Computer Memory - Black (CMK32GX5M2B6000C38)",
    price: "7299 EGP",
    quantity: 4,
    description: "32 GB (2×16 GB) CORSAIR Vengeance DDR5 desktop memory kit featuring a 6000 MHz speed, CL38 latency, Intel XMP 3.0 support, black aluminum heat spreaders, and a dual-channel design for high-performance gaming, multitasking, and content creation.",
    category: "Memory",
},
{
    name: "Samsung 990 PRO 2TB NVMe SSD (PCIe 4.0, M.2 2280, Heatsink) – Up to 7,450 MB/s read, 6,900 MB/s write, PS5 compatible, 2GB LPDDR4 cache, AES 256-bit encryption, 3-year warranty.",
    price: "16250 EGP",
    quantity: 7,
    description: "2 TB Samsung 990 PRO M.2 2280 NVMe SSD featuring PCIe 4.0 x4 connectivity, sequential read speeds of up to 7,450 MB/s, write speeds of up to 6,900 MB/s, 2 GB DRAM cache, and V-NAND flash for ultra-fast gaming, content creation, and high-performance computing.",
    category: "Storage",
},
{
    name: "ASUS ROG Strix X870E-E Motherboard",
    price: "30500 EGP",
    quantity: 10,
    description: "ATX motherboard for AMD Ryzen 9000, 8000, and 7000 Series processors on the AM5 platform, featuring the X870E chipset, DDR5 support up to 256 GB, PCIe 5.0 expansion, five M.2 slots, Wi-Fi 7, Bluetooth 5.4, 5 Gb Ethernet, extensive USB connectivity, and premium gaming features for high-performance gaming, content creation, and enthusiast PC builds.",
    category: "Motherboard",
},
{
    name: "CORSAIR RM1000x — 1000 Watt 80 PLUS Gold Fully Modular ATX PSU (CP-9020201-UK)",
    price: "7350 EGP",
    quantity: 20,
    description: "1000 W fully modular ATX power supply featuring 80 PLUS Gold efficiency, premium Japanese capacitors, a quiet 135 mm cooling fan, comprehensive protection circuits, and ample CPU, PCIe, and SATA connectivity for reliable power delivery in high-performance gaming and workstation PC builds.",
    category: "Power Supply",
},
];

const seedDatabase = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB for seeding");

        await Product.deleteMany({});
        console.log("Old product data cleared");

        await Product.insertMany(sampleProducts);
        console.log(`${sampleProducts.length} sample products inserted`);
    }
    catch (err) {
        console.error("Seeding failed:", err.message)
    }
    finally {
        await mongoose.connection.close();
        console.log("Database connection closed");
    }
};

seedDatabase();