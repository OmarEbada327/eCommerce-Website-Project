const mongoose = require("mongoose");
const Product = require("./models/productModel");
const { MONGO_URI } = require("./config/config");


const sampleProducts = [{
    name: "AMD RYZEN 9-9950X3D2 Dual Edition Box",
    price: 57499,
    quantity: 25,
    description: "16-core, 32-thread Ryzen 9 9950X3D desktop processor based on the Ryzen 9000 Series for the AM5 platform, featuring 209.25 MB total cache with AMD 3D V-Cache technology, a 4.3 GHz base clock and up to 5.6 GHz boost clock, DDR5 memory support, PCIe 5.0 connectivity, integrated AMD Radeon Graphics, and an unlocked multiplier for enthusiast gaming, content creation, and overclocking.",
    category: "CPU",
    images: [
        { url:"https://res.cloudinary.com/vad2jw7q/image/upload/v1783456553/Ryzen_9-9950X3D2_xmatiy.png", publicId: "Ryzen_9-9950X3D2_xmatiy"},
        { url:"https://res.cloudinary.com/vad2jw7q/image/upload/v1783467644/Ryzen_9-9950X3D2_Front_uvcsts.webp", publicId: "Ryzen_9-9950X3D2_Front_uvcsts"},
        { url: "https://res.cloudinary.com/vad2jw7q/image/upload/v1783467647/Ryzen_9-9950X3D2_tray_hpsx4n.jpg", publicId: "Ryzen_9-9950X3D2_tray_hpsx4n"},
        { url: "https://res.cloudinary.com/vad2jw7q/image/upload/v1783467652/Ryzen_9-9950X3D2_poster_xoxh4p.png", publicId: "Ryzen_9-9950X3D2_poster_xoxh4p"},
    ],
},
{
    name: "ASUS TUF Gaming GeForce RTX 5090 32GB GDDR7",
    price: 211000,
    quantity: 5,
    description: "NVIDIA GeForce RTX 5090 graphics card with 32 GB GDDR7 memory, 21,760 CUDA cores, a 2437 MHz boost clock, PCIe 5.0 support, triple-fan cooling, quad-slot TUF Gaming design, HDMI 2.1b and DisplayPort 2.1b outputs, AI performance up to 3352 TOPS, and 8K display support for ultra-high-end gaming, AI, and professional creative workloads.",
    category: "GPU",
    images: [
        {url: "https://res.cloudinary.com/vad2jw7q/image/upload/v1783464736/ASUS_TUF_Gaming_GeForce_RTX_5090_slia0x.png", publicId: "ASUS_TUF_Gaming_GeForce_RTX_5090_slia0x"},
        {url: "https://res.cloudinary.com/vad2jw7q/image/upload/v1783467523/ASUS_TUF_Gaming_GeForce_RTX_5090_Front_abqccp.png", publicId: "ASUS_TUF_Gaming_GeForce_RTX_5090_Front_abqccp"},
        {url: "https://res.cloudinary.com/vad2jw7q/image/upload/v1783467525/ASUS_TUF_Gaming_GeForce_RTX_5090_Back_tkfcmq.png", publicId: "ASUS_TUF_Gaming_GeForce_RTX_5090_Back_tkfcmq"},
        {url: "https://res.cloudinary.com/vad2jw7q/image/upload/v1783467520/ASUS_TUF_Gaming_GeForce_RTX_5090_Ports_rwbtlh.png", publicId: "ASUS_TUF_Gaming_GeForce_RTX_5090_Ports_rwbtlh"},
    ],
},
{
    name: "AMD Ryzen 7 9800X3D: 8C/16T, 4.7GHz Base, 5.2GHz Boost, 96MB L3 Cache, 120W TDP, AM5, DDR5, PCIe 5.0, Radeon iGPU (2C, 2200MHz)",
    price: 24999,
    quantity: 30,
    description: "8-core, 16-thread Ryzen 7 9800X3D desktop processor featuring AMD 3D V-Cache technology, a 4.7 GHz base clock and up to 5.2 GHz boost clock, 96 MB cache, DDR5 and PCIe 5.0 support, integrated AMD Radeon Graphics, and an unlocked multiplier for high-performance gaming and demanding multitasking.",
    category: "CPU",
    images: [
        {url: "https://res.cloudinary.com/vad2jw7q/image/upload/v1783464735/Ryzen_7_9800X3D_dbwplv.png", publicId: "Ryzen_7_9800X3D_dbwplv"},
        {url: "https://res.cloudinary.com/vad2jw7q/image/upload/v1783467608/Ryzen_7_9800X3D_Front_olmkcz.png", publicId: "Ryzen_7_9800X3D_Front_olmkcz"},
        {url: "https://res.cloudinary.com/vad2jw7q/image/upload/v1783467615/Ryzen_7_9800X3D_CPU_yiug28.png", publicId: "Ryzen_7_9800X3D_CPU_yiug28"},
        {url: "https://res.cloudinary.com/vad2jw7q/image/upload/v1783467618/Ryzen_7_9800X3D_poster_ow1qmp.png", publicId: "Ryzen_7_9800X3D_poster_ow1qmp"},
    ],
},
{
    name: "PNY GeForce RTX 5080 OC Triple Fan Blackwell Architecture 16GB GDDR7",
    price: 74999,
    quantity: 10,
    description: "NVIDIA GeForce RTX 5080 graphics card based on the Blackwell architecture, featuring 16 GB GDDR7 memory, 10,752 CUDA cores, a boost clock of up to 2.73 GHz, PCIe 5.0 support, triple-fan cooling, and DirectX 12 Ultimate compatibility for 4K gaming, AI acceleration, and high-performance creative workloads.",
    category: "GPU",
    images: [
        {url: "https://res.cloudinary.com/vad2jw7q/image/upload/v1783464733/PNY_GeForce_RTX_5080_OC_Triple_Fan_Blackwell_wl4tkk.png", publicId: "PNY_GeForce_RTX_5080_OC_Triple_Fan_Blackwell_wl4tkk"},
        {url: "https://res.cloudinary.com/vad2jw7q/image/upload/v1783467580/PNY_GeForce_RTX_5080_OC_Triple_Fan_Blackwell_Front_xfbfdx.png", publicId: "PNY_GeForce_RTX_5080_OC_Triple_Fan_Blackwell_Front_xfbfdx"},
        {url: "https://res.cloudinary.com/vad2jw7q/image/upload/v1783467574/PNY_GeForce_RTX_5080_OC_Triple_Fan_Blackwell_Back_tvrgcw.png", publicId: "PNY_GeForce_RTX_5080_OC_Triple_Fan_Blackwell_Back_tvrgcw"},
        {url: "https://res.cloudinary.com/vad2jw7q/image/upload/v1783467577/PNY_GeForce_RTX_5080_OC_Triple_Fan_Blackwell_Body_yfkubz.png", publicId: "PNY_GeForce_RTX_5080_OC_Triple_Fan_Blackwell_Body_yfkubz"},
        {url: "https://res.cloudinary.com/vad2jw7q/image/upload/v1783467582/PNY_GeForce_RTX_5080_OC_Triple_Fan_Blackwell_Parts_yuvmy0.png", publicId: "PNY_GeForce_RTX_5080_OC_Triple_Fan_Blackwell_Parts_yuvmy0"},
    ],
},
{
    name: "CORSAIR Vengeance DDR5 RAM 32GB (2x16GB) 6000MHz CL38 Intel XMP iCUE Compatible Computer Memory - Black (CMK32GX5M2B6000C38)",
    price: 7299,
    quantity: 4,
    description: "32 GB (2×16 GB) CORSAIR Vengeance DDR5 desktop memory kit featuring a 6000 MHz speed, CL38 latency, Intel XMP 3.0 support, black aluminum heat spreaders, and a dual-channel design for high-performance gaming, multitasking, and content creation.",
    category: "Memory",
    images: [
        {url: "https://res.cloudinary.com/vad2jw7q/image/upload/v1783464734/CORSAIR_Vengeance_DDR5_RAM_32GB_oqwoog.png", publicId: "CORSAIR_Vengeance_DDR5_RAM_32GB_oqwoog"},
        {url: "https://res.cloudinary.com/vad2jw7q/image/upload/v1783467550/CORSAIR_Vengeance_DDR5_RAM_32GB_Kit_czzghu.png", publicId: "CORSAIR_Vengeance_DDR5_RAM_32GB_Kit_czzghu"},
        {url: "https://res.cloudinary.com/vad2jw7q/image/upload/v1783467547/CORSAIR_Vengeance_DDR5_RAM_32GB_Half_Kit_tkzsyp.png", publicId: "CORSAIR_Vengeance_DDR5_RAM_32GB_Half_Kit_tkzsyp"},
        {url: "https://res.cloudinary.com/vad2jw7q/image/upload/v1783467553/CORSAIR_Vengeance_DDR5_RAM_32GB_poster_yl4rxc.png", publicId: "CORSAIR_Vengeance_DDR5_RAM_32GB_poster_yl4rxc"},
    ],
},
{
    name: "Samsung 990 PRO 2TB NVMe SSD (PCIe 4.0, M.2 2280, Heatsink) – Up to 7,450 MB/s read, 6,900 MB/s write, PS5 compatible, 2GB LPDDR4 cache, AES 256-bit encryption, 3-year warranty.",
    price: 16250,
    quantity: 7,
    description: "2 TB Samsung 990 PRO M.2 2280 NVMe SSD featuring PCIe 4.0 x4 connectivity, sequential read speeds of up to 7,450 MB/s, write speeds of up to 6,900 MB/s, 2 GB DRAM cache, and V-NAND flash for ultra-fast gaming, content creation, and high-performance computing.",
    category: "Storage",
    images: [
        {url: "https://res.cloudinary.com/vad2jw7q/image/upload/v1783464732/Samsung_990_PRO_2TB_NVMe_SSD_bj059d.png", publicId: "Samsung_990_PRO_2TB_NVMe_SSD_bj059d"},
        {url: "https://res.cloudinary.com/vad2jw7q/image/upload/v1783467717/Samsung_990_PRO_2TB_NVMe_SSD_Back_uw9u8y.png", publicId: "Samsung_990_PRO_2TB_NVMe_SSD_Back_uw9u8y"},
        {url: "https://res.cloudinary.com/vad2jw7q/image/upload/v1783467721/Samsung_990_PRO_2TB_NVMe_SSD_Packet_bpydsk.png", publicId: "Samsung_990_PRO_2TB_NVMe_SSD_Packet_bpydsk"},
        {url: "https://res.cloudinary.com/vad2jw7q/image/upload/v1783467724/Samsung_990_PRO_2TB_NVMe_SSD_Case_zlo5gm.png", publicId: "Samsung_990_PRO_2TB_NVMe_SSD_Case_zlo5gm"},
    ],
},
{
    name: "ASUS ROG Strix X870E-E Motherboard",
    price: 30500,
    quantity: 10,
    description: "ATX motherboard for AMD Ryzen 9000, 8000, and 7000 Series processors on the AM5 platform, featuring the X870E chipset, DDR5 support up to 256 GB, PCIe 5.0 expansion, five M.2 slots, Wi-Fi 7, Bluetooth 5.4, 5 Gb Ethernet, extensive USB connectivity, and premium gaming features for high-performance gaming, content creation, and enthusiast PC builds.",
    category: "Motherboard",
    images: [
        {url: "https://res.cloudinary.com/vad2jw7q/image/upload/v1783464733/ASUS_ROG_STRIX_X870E-E_GAMING_WIFI_Socket_LGA_1718_Motherboard_uzf5lv.png", publicId: "ASUS_ROG_STRIX_X870E-E_GAMING_WIFI_Socket_LGA_1718_Motherboard_uzf5lv"},
        {url: "https://res.cloudinary.com/vad2jw7q/image/upload/v1783467504/ASUS_ROG_STRIX_X870E-E_GAMING_WIFI_Socket_LGA_1718_Motherboard_Front_is2vof.png", publicId: "ASUS_ROG_STRIX_X870E-E_GAMING_WIFI_Socket_LGA_1718_Motherboard_Front_is2vof"},
        {url: "https://res.cloudinary.com/vad2jw7q/image/upload/v1783467503/ASUS_ROG_STRIX_X870E-E_GAMING_WIFI_Socket_LGA_1718_Motherboard_Side_mnppwa.png", publicId: "ASUS_ROG_STRIX_X870E-E_GAMING_WIFI_Socket_LGA_1718_Motherboard_Side_mnppwa"},
        {url: "https://res.cloudinary.com/vad2jw7q/image/upload/v1783467499/ASUS_ROG_STRIX_X870E-E_GAMING_WIFI_Socket_LGA_1718_Motherboard_Ports_fnnmih.png", publicId: "ASUS_ROG_STRIX_X870E-E_GAMING_WIFI_Socket_LGA_1718_Motherboard_Ports_fnnmih"},
    ],
},
{
    name: "CORSAIR RM1000x — 1000 Watt 80 PLUS Gold Fully Modular ATX PSU (CP-9020201-UK)",
    price: 7350,
    quantity: 20,
    description: "1000 W fully modular ATX power supply featuring 80 PLUS Gold efficiency, premium Japanese capacitors, a quiet 135 mm cooling fan, comprehensive protection circuits, and ample CPU, PCIe, and SATA connectivity for reliable power delivery in high-performance gaming and workstation PC builds.",
    category: "Power Supply",
    images: [
        {url: "https://res.cloudinary.com/vad2jw7q/image/upload/v1783464734/CORSAIR_RM1000x_dx4ety.png", publicId: "CORSAIR_RM1000x_dx4ety"},
        {url: "https://res.cloudinary.com/vad2jw7q/image/upload/v1783467475/CORSAIR_RM1000x_Cables_zpodks.png", publicId: "CORSAIR_RM1000x_Cables_zpodks"},
        {url: "https://res.cloudinary.com/vad2jw7q/image/upload/v1783467477/CORSAIR_RM1000x_poster_ezrmk3.png", publicId: "CORSAIR_RM1000x_poster_ezrmk3"},
        {url: "https://res.cloudinary.com/vad2jw7q/image/upload/v1783467479/CORSAIR_RM1000x_Power_oxb2tc.png", publicId: "CORSAIR_RM1000x_Power_oxb2tc"},
    ],
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