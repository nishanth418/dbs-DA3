const express = require('express');
const router = express.Router();
const { query, execute } = require('../database');

// GET all suppliers with phone numbers
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;

    const cypher = `
      MATCH (s:Supplier)
      OPTIONAL MATCH (s)-[:HAS_PHONE]->(sp:SupplierPhone)
      OPTIONAL MATCH (p:Procures)-[:FROM_SUPPLIER]->(s)
      WHERE ($search IS NULL OR toLower(s.SupplierName) CONTAINS toLower($search))
      WITH s, collect(DISTINCT sp.PhoneNo) AS phonesList, count(DISTINCT p) AS total_orders, coalesce(sum(p.Quantity * 100), 0) AS total_procured_value
      RETURN 
        s.SupplierID AS supplier_id,
        s.SupplierID AS SupplierID,
        s.SupplierName AS name,
        s.SupplierName AS supplier_name,
        s.SupplierName AS SupplierName,
        'Provisions' AS category,
        reduce(acc = '', p IN phonesList | CASE WHEN acc = '' THEN p ELSE acc + ', ' + p END) AS phone_numbers,
        total_orders,
        total_procured_value
      ORDER BY s.SupplierName ASC
    `;

    const rows = await query(cypher, {
      search: search && search.trim() ? search.trim() : null
    });

    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single supplier
router.get('/:id', async (req, res) => {
  try {
    const supplierId = req.params.id;
    const cypher = `
      MATCH (s:Supplier {SupplierID: $supplierId})
      RETURN 
        s.SupplierID AS supplier_id,
        s.SupplierID AS SupplierID,
        s.SupplierName AS name,
        s.SupplierName AS supplier_name,
        s.SupplierName AS SupplierName,
        'Provisions' AS category
    `;
    const rows = await query(cypher, { supplierId });

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    const supplier = rows[0];
    const phoneRows = await query(`
      MATCH (s:Supplier {SupplierID: $supplierId})-[:HAS_PHONE]->(sp:SupplierPhone)
      RETURN sp.PhoneNo AS phone_number
    `, { supplierId });
    const phones = phoneRows.map(p => p.phone_number);

    const procurements = await query(`
      MATCH (p:Procures {SupplierID: $supplierId})-[:OF_ITEM]->(i:InventoryItem)
      RETURN p.MessID AS MessID, p.SupplierID AS SupplierID, p.ItemID AS ItemID, p.Quantity AS quantity, i.ItemName AS item_name, i.Unit AS unit
    `, { supplierId });

    res.json({ success: true, data: { ...supplier, phones, procurements } });
  } catch (error) {
    console.error('Error fetching supplier by ID:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create supplier
router.post('/', async (req, res) => {
  try {
    const { SupplierID, supplier_id, SupplierName, supplier_name, name, phones } = req.body;
    const finalId = SupplierID || supplier_id || ('SUP' + (Math.floor(Math.random() * 90) + 10));
    const finalName = SupplierName || supplier_name || name;
    if (!finalName) {
      return res.status(400).json({ success: false, message: 'Supplier name is required' });
    }

    await execute(`
      MERGE (s:Supplier {SupplierID: $supplierId})
      SET s.SupplierName = $name
    `, { supplierId: finalId, name: finalName });

    if (phones && Array.isArray(phones)) {
      for (const p of phones) {
        if (p && String(p).trim()) {
          await execute(`
            MERGE (sp:SupplierPhone {SupplierID: $supplierId, PhoneNo: $phoneNo})
            WITH sp
            MATCH (s:Supplier {SupplierID: $supplierId})
            MERGE (s)-[:HAS_PHONE]->(sp)
          `, { supplierId: finalId, phoneNo: String(p).trim() });
        }
      }
    }

    res.status(201).json({ success: true, message: 'Supplier created successfully', supplierId: finalId });
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT update supplier
router.put('/:id', async (req, res) => {
  try {
    const supplierId = req.params.id;
    const body = req.body || {};

    const existingRows = await query(`MATCH (s:Supplier {SupplierID: $supplierId}) RETURN s`, { supplierId });
    if (existingRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    const existing = existingRows[0];

    await execute(`
      MATCH (s:Supplier {SupplierID: $supplierId})
      SET s.SupplierName = $name
    `, {
      supplierId,
      name: body.SupplierName || body.supplier_name || body.name || existing.SupplierName
    });

    if (body.phones && Array.isArray(body.phones)) {
      await execute(`
        MATCH (s:Supplier {SupplierID: $supplierId})-[r:HAS_PHONE]->(sp:SupplierPhone)
        DETACH DELETE sp
      `, { supplierId });

      for (const p of body.phones) {
        if (p && String(p).trim()) {
          await execute(`
            MERGE (sp:SupplierPhone {SupplierID: $supplierId, PhoneNo: $phoneNo})
            WITH sp
            MATCH (s:Supplier {SupplierID: $supplierId})
            MERGE (s)-[:HAS_PHONE]->(sp)
          `, { supplierId, phoneNo: String(p).trim() });
        }
      }
    }

    res.json({ success: true, message: 'Supplier updated successfully' });
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE supplier
router.delete('/:id', async (req, res) => {
  try {
    const supplierId = req.params.id;
    await execute(`
      MATCH (s:Supplier {SupplierID: $supplierId})
      OPTIONAL MATCH (s)-[:HAS_PHONE]->(sp:SupplierPhone)
      DETACH DELETE s, sp
    `, { supplierId });
    res.json({ success: true, message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
