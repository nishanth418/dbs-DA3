const express = require('express');
const router = express.Router();
const { query, execute, syncRelationships } = require('../database');

// GET all procurements
router.get('/', async (req, res) => {
  try {
    const { supplier_id, item_id, mess_id } = req.query;

    const cypher = `
      MATCH (p:Procures)
      OPTIONAL MATCH (m:Mess {MessID: p.MessID})
      OPTIONAL MATCH (s:Supplier {SupplierID: p.SupplierID})
      OPTIONAL MATCH (i:InventoryItem {ItemID: p.ItemID})
      WHERE ($supplierId IS NULL OR p.SupplierID = $supplierId)
        AND ($itemId IS NULL OR p.ItemID = $itemId)
        AND ($messId IS NULL OR p.MessID = $messId)
      RETURN 
        p.MessID + '-' + p.SupplierID + '-' + p.ItemID AS procure_id,
        p.MessID AS mess_id,
        p.MessID AS MessID,
        coalesce(m.MessName, 'Mess ' + p.MessID) AS mess_name,
        p.SupplierID AS supplier_id,
        p.SupplierID AS SupplierID,
        coalesce(s.SupplierName, 'Supplier ' + p.SupplierID) AS supplier_name,
        p.ItemID AS item_id,
        p.ItemID AS ItemID,
        coalesce(i.ItemName, 'Item ' + p.ItemID) AS item_name,
        coalesce(i.Category, 'General') AS item_category,
        coalesce(i.Unit, 'Units') AS item_unit,
        p.Quantity AS quantity,
        p.Quantity AS Quantity,
        (p.Quantity * 100) AS total_cost,
        'Completed' AS status
      ORDER BY p.MessID ASC, p.SupplierID ASC
    `;

    const rows = await query(cypher, {
      supplierId: supplier_id && supplier_id.trim() ? supplier_id.trim() : null,
      itemId: item_id && item_id.trim() ? item_id.trim() : null,
      messId: mess_id && mess_id.trim() ? mess_id.trim() : null
    });

    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Error fetching procurements:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create procurement
router.post('/', async (req, res) => {
  try {
    const { MessID, mess_id, SupplierID, supplier_id, ItemID, item_id, Quantity, quantity } = req.body;
    const finalMessId = MessID || mess_id;
    const finalSupplierId = SupplierID || supplier_id;
    const finalItemId = ItemID || item_id;
    const finalQty = Number(Quantity !== undefined ? Quantity : (quantity || 10));

    if (!finalMessId || !finalSupplierId || !finalItemId) {
      return res.status(400).json({ success: false, message: 'MessID, SupplierID, and ItemID are required' });
    }

    const procureProps = {
      MessID: finalMessId,
      SupplierID: finalSupplierId,
      ItemID: finalItemId,
      Quantity: finalQty
    };

    await execute(`
      MERGE (p:Procures {MessID: $messId, SupplierID: $supplierId, ItemID: $itemId})
      SET p += $props
    `, {
      messId: finalMessId,
      supplierId: finalSupplierId,
      itemId: finalItemId,
      props: procureProps
    });

    await syncRelationships('Procures', procureProps);

    res.status(201).json({ success: true, message: 'Procurement recorded successfully' });
  } catch (error) {
    console.error('Error recording procurement:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE procurement
router.delete('/', async (req, res) => {
  try {
    const { MessID, mess_id, SupplierID, supplier_id, ItemID, item_id } = req.query;
    const finalMessId = MessID || mess_id;
    const finalSupplierId = SupplierID || supplier_id;
    const finalItemId = ItemID || item_id;

    if (!finalMessId || !finalSupplierId || !finalItemId) {
      return res.status(400).json({ success: false, message: 'MessID, SupplierID, and ItemID parameters are required' });
    }

    await execute(`
      MATCH (p:Procures {MessID: $messId, SupplierID: $supplierId, ItemID: $itemId})
      DETACH DELETE p
    `, {
      messId: finalMessId,
      supplierId: finalSupplierId,
      itemId: finalItemId
    });

    res.json({ success: true, message: 'Procurement removed successfully' });
  } catch (error) {
    console.error('Error deleting procurement:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
