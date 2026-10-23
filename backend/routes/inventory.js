const express = require('express');
const router = express.Router();
const { query, execute } = require('../database');

// GET all inventory items
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;

    const cypher = `
      MATCH (i:InventoryItem)
      OPTIONAL MATCH (p:Procures)-[:OF_ITEM]->(i)
      WHERE ($category IS NULL OR i.Category = $category)
        AND ($search IS NULL OR toLower(i.ItemName) CONTAINS toLower($search) 
              OR toLower(i.Category) CONTAINS toLower($search))
      WITH i, coalesce(sum(p.Quantity), 0) AS quantity
      RETURN 
        i.ItemID AS item_id,
        i.ItemID AS ItemID,
        i.ItemName AS item_name,
        i.ItemName AS name,
        i.ItemName AS ItemName,
        i.Category AS category,
        i.Category AS Category,
        i.Unit AS unit,
        i.Unit AS Unit,
        quantity,
        100 AS min_required_quantity,
        0 AS is_low_stock
      ORDER BY i.Category ASC, i.ItemName ASC
    `;

    const rows = await query(cypher, {
      category: category && category.trim() ? category.trim() : null,
      search: search && search.trim() ? search.trim() : null
    });

    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single inventory item
router.get('/:id', async (req, res) => {
  try {
    const itemId = req.params.id;
    const cypher = `
      MATCH (i:InventoryItem {ItemID: $itemId})
      OPTIONAL MATCH (p:Procures)-[:OF_ITEM]->(i)
      WITH i, coalesce(sum(p.Quantity), 0) AS quantity
      RETURN 
        i.ItemID AS item_id,
        i.ItemID AS ItemID,
        i.ItemName AS item_name,
        i.ItemName AS name,
        i.ItemName AS ItemName,
        i.Category AS category,
        i.Category AS Category,
        i.Unit AS unit,
        i.Unit AS Unit,
        quantity,
        100 AS min_required_quantity
    `;
    const rows = await query(cypher, { itemId });

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const item = rows[0];
    const procurements = await query(`
      MATCH (p:Procures {ItemID: $itemId})-[:FROM_SUPPLIER]->(s:Supplier)
      RETURN p.MessID AS MessID, p.SupplierID AS SupplierID, p.ItemID AS ItemID, p.Quantity AS quantity, s.SupplierName AS supplier_name
    `, { itemId });

    res.json({ success: true, data: { ...item, procurements } });
  } catch (error) {
    console.error('Error fetching inventory item by ID:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create inventory item
router.post('/', async (req, res) => {
  try {
    const { ItemID, item_id, ItemName, item_name, name, Category, category, Unit, unit } = req.body;
    const finalId = ItemID || item_id || ('IT' + (100 + Math.floor(Math.random() * 900)));
    const finalName = ItemName || item_name || name;

    if (!finalName) {
      return res.status(400).json({ success: false, message: 'Item name is required' });
    }

    const itemProps = {
      ItemID: finalId,
      ItemName: finalName,
      Category: Category || category || 'General',
      Unit: Unit || unit || 'Kg'
    };

    await execute(`
      MERGE (i:InventoryItem {ItemID: $itemId})
      SET i += $props
    `, { itemId: finalId, props: itemProps });

    res.status(201).json({ success: true, message: 'Item created successfully', itemId: finalId });
  } catch (error) {
    console.error('Error creating inventory item:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT update inventory item
router.put('/:id', async (req, res) => {
  try {
    const itemId = req.params.id;
    const body = req.body || {};

    const existingRows = await query(`MATCH (i:InventoryItem {ItemID: $itemId}) RETURN i`, { itemId });
    if (existingRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    const existing = existingRows[0];

    const updatedProps = {
      ItemName: body.ItemName || body.item_name || body.name || existing.ItemName,
      Category: body.Category || body.category || existing.Category,
      Unit: body.Unit || body.unit || existing.Unit
    };

    await execute(`
      MATCH (i:InventoryItem {ItemID: $itemId})
      SET i += $props
    `, { itemId, props: updatedProps });

    res.json({ success: true, message: 'Item updated successfully' });
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE inventory item
router.delete('/:id', async (req, res) => {
  try {
    const itemId = req.params.id;
    await execute(`MATCH (i:InventoryItem {ItemID: $itemId}) DETACH DELETE i`, { itemId });
    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
