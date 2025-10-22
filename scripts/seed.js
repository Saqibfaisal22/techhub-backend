require("dotenv").config()
const { sequelize, User, Category, Brand, Product, Page, BlogPost } = require("../models")
const bcrypt = require("bcryptjs")

const seedDatabase = async () => {
  try {
    console.log("🌱 Starting database seeding...")

    // Create admin user
    const adminUser = await User.create({
      email: process.env.ADMIN_EMAIL || "admin@techhub.com",
      password: process.env.ADMIN_PASSWORD || "admin123",
      first_name: "Admin",
      last_name: "User",
      role: "admin",
      email_verified: true,
      is_active: true,
    })

    // Create sample customer
    const customer = await User.create({
      email: "customer@example.com",
      password: "customer123",
      first_name: "John",
      last_name: "Doe",
      phone: "+1234567890",
      role: "customer",
      email_verified: true,
      is_active: true,
    })

    // Create categories
    const categories = await Category.bulkCreate([
      {
        name: "Processors",
        slug: "processors",
        description: "High-performance CPUs for workstations and servers",
        is_active: true,
        sort_order: 1,
      },
      {
        name: "Memory",
        slug: "memory",
        description: "RAM modules and memory solutions",
        is_active: true,
        sort_order: 2,
      },
      {
        name: "Storage",
        slug: "storage",
        description: "SSDs, HDDs, and storage solutions",
        is_active: true,
        sort_order: 3,
      },
      {
        name: "Networking",
        slug: "networking",
        description: "Network equipment and solutions",
        is_active: true,
        sort_order: 4,
      },
    ])

    // Create brands
    const brands = await Brand.bulkCreate([
      {
        name: "Intel",
        slug: "intel",
        description: "Leading processor and technology manufacturer",
        is_active: true,
      },
      {
        name: "AMD",
        slug: "amd",
        description: "Advanced processor and graphics solutions",
        is_active: true,
      },
      {
        name: "Samsung",
        slug: "samsung",
        description: "Memory and storage solutions",
        is_active: true,
      },
      {
        name: "Cisco",
        slug: "cisco",
        description: "Enterprise networking equipment",
        is_active: true,
      },
    ])

    // Create sample products
    await Product.bulkCreate([
      {
        name: "Intel Core i9-13900K",
        slug: "intel-core-i9-13900k",
        description: "High-performance desktop processor with 24 cores",
        short_description: "24-core desktop processor for gaming and content creation",
        sku: "INTEL-I9-13900K",
        model: "i9-13900K",
        brand_id: brands[0].id,
        category_id: categories[0].id,
        price: 589.99,
        compare_price: 649.99,
        stock_quantity: 25,
        status: "active",
        featured: true,
      },
      {
        name: "AMD Ryzen 9 7950X",
        slug: "amd-ryzen-9-7950x",
        description: "16-core, 32-thread desktop processor",
        short_description: "High-performance AMD processor for enthusiasts",
        sku: "AMD-R9-7950X",
        model: "7950X",
        brand_id: brands[1].id,
        category_id: categories[0].id,
        price: 699.99,
        stock_quantity: 15,
        status: "active",
        featured: true,
      },
      {
        name: "Samsung 32GB DDR5-4800",
        slug: "samsung-32gb-ddr5-4800",
        description: "High-speed DDR5 memory module",
        short_description: "32GB DDR5 memory for high-performance systems",
        sku: "SAMSUNG-32GB-DDR5",
        model: "M378A4G43AB2-CWE",
        brand_id: brands[2].id,
        category_id: categories[1].id,
        price: 299.99,
        stock_quantity: 50,
        status: "active",
      },
    ])

    // Create CMS pages
    await Page.bulkCreate([
      {
        title: "About Us",
        slug: "about-us",
        content: `
          <h1>About TechHub</h1>
          <p>TechHub is your trusted partner for professional computer hardware and IT solutions. With over a decade of experience in the industry, we specialize in providing enterprise-grade equipment to businesses and technology enthusiasts.</p>
          
          <h2>Our Mission</h2>
          <p>To deliver cutting-edge technology solutions that empower businesses to achieve their goals through reliable, high-performance hardware and exceptional customer service.</p>
          
          <h2>Why Choose TechHub?</h2>
          <ul>
            <li>Extensive inventory of enterprise-grade hardware</li>
            <li>Expert technical support and consultation</li>
            <li>Competitive pricing and bulk discounts</li>
            <li>Fast, reliable shipping nationwide</li>
            <li>Comprehensive warranty and support services</li>
          </ul>
        `,
        excerpt: "Learn about TechHub's mission to provide enterprise-grade computer hardware and IT solutions.",
        status: "published",
        meta_title: "About TechHub - Professional Computer Hardware & IT Solutions",
        meta_description:
          "Discover TechHub's commitment to providing enterprise-grade computer hardware, expert support, and reliable IT solutions for businesses and technology enthusiasts.",
      },
      {
        title: "Privacy Policy",
        slug: "privacy-policy",
        content: `
          <h1>Privacy Policy</h1>
          <p><strong>Last updated:</strong> ${new Date().toLocaleDateString()}</p>
          
          <h2>Information We Collect</h2>
          <p>We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support.</p>
          
          <h2>How We Use Your Information</h2>
          <p>We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.</p>
          
          <h2>Information Sharing</h2>
          <p>We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.</p>
          
          <h2>Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us at privacy@techhub.com.</p>
        `,
        status: "published",
        meta_title: "Privacy Policy - TechHub",
        meta_description:
          "Read TechHub's privacy policy to understand how we collect, use, and protect your personal information.",
      },
    ])

    // Create sample blog posts
    await BlogPost.bulkCreate([
      {
        title: "The Future of Enterprise Computing: Trends to Watch in 2024",
        slug: "future-enterprise-computing-2024",
        content: `
          <p>As we move through 2024, enterprise computing continues to evolve at a rapid pace. Organizations are increasingly looking for solutions that offer better performance, efficiency, and scalability.</p>
          
          <h2>Key Trends Shaping Enterprise Computing</h2>
          
          <h3>1. AI-Optimized Hardware</h3>
          <p>The integration of AI capabilities directly into hardware is becoming more prevalent, with processors designed specifically for machine learning workloads.</p>
          
          <h3>2. Edge Computing Expansion</h3>
          <p>More businesses are deploying edge computing solutions to reduce latency and improve data processing efficiency.</p>
          
          <h3>3. Sustainable Technology</h3>
          <p>Energy-efficient hardware and sustainable computing practices are becoming priorities for environmentally conscious organizations.</p>
          
          <p>At TechHub, we're committed to staying ahead of these trends and providing our customers with the latest enterprise-grade solutions.</p>
        `,
        excerpt:
          "Explore the key trends shaping enterprise computing in 2024, from AI-optimized hardware to sustainable technology solutions.",
        author_id: adminUser.id,
        status: "published",
        published_at: new Date(),
        meta_title: "Enterprise Computing Trends 2024 - TechHub Blog",
        meta_description:
          "Discover the latest trends in enterprise computing for 2024, including AI-optimized hardware, edge computing, and sustainable technology solutions.",
      },
    ])

    console.log("✅ Database seeding completed successfully!")
    console.log(`👤 Admin user created: ${adminUser.email}`)
    console.log(`👤 Customer user created: ${customer.email}`)
    console.log(`📦 Created ${categories.length} categories`)
    console.log(`🏷️ Created ${brands.length} brands`)
    console.log("🛍️ Created sample products")
    console.log("📄 Created CMS pages")
    console.log("📝 Created sample blog posts")
  } catch (error) {
    console.error("❌ Error seeding database:", error)
  } finally {
    await sequelize.close()
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
}

module.exports = seedDatabase
