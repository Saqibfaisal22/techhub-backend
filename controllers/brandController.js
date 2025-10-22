const { Brand } = require("../models");

// Get all brands
const getBrands = async (req, res) => {
  try {
    const brands = await Brand.findAll();
    res.json({ success: true, brands });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch brands" });
  }
};

// Get single brand
const getBrand = async (req, res) => {
  try {
    const brand = await Brand.findByPk(req.params.id);
    if (!brand) return res.status(404).json({ success: false, message: "Brand not found" });
    res.json({ success: true, brand });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch brand" });
  }
};

// Create brand
const createBrand = async (req, res) => {
  try {
    const brand = await Brand.create(req.body);
    res.status(201).json({ success: true, brand });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create brand" });
  }
};

// Update brand
const updateBrand = async (req, res) => {
  try {
    const brand = await Brand.findByPk(req.params.id);
    if (!brand) return res.status(404).json({ success: false, message: "Brand not found" });
    await brand.update(req.body);
    res.json({ success: true, brand });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update brand" });
  }
};

// Delete brand
const deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findByPk(req.params.id);
    if (!brand) return res.status(404).json({ success: false, message: "Brand not found" });
    await brand.destroy();
    res.json({ success: true, message: "Brand deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete brand" });
  }
};

module.exports = { getBrands, getBrand, createBrand, updateBrand, deleteBrand };
