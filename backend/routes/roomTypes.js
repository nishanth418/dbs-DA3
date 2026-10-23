const express = require('express');
const router = express.Router();
const { query, execute } = require('../database');

// GET all room types
router.get('/', async (req, res) => {
  try {
    const rows = await query(`
      MATCH (rt:RoomType)
      OPTIONAL MATCH (r:Room) WHERE r.Type = rt.TypeName OR r.Type CONTAINS rt.TypeName
      WITH rt, count(r) AS total_rooms_configured
      RETURN 
        rt.TypeID AS type_id,
        rt.TypeID AS TypeID,
        rt.TypeName AS type_name,
        rt.TypeName AS TypeName,
        rt.AC_Type AS ac_type,
        rt.AC_Type AS AC_Type,
        rt.Capacity AS capacity,
        rt.Capacity AS Capacity,
        5000 AS fee_per_month,
        total_rooms_configured
      ORDER BY rt.TypeID ASC
    `);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Error fetching room types:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single room type
router.get('/:id', async (req, res) => {
  try {
    const rows = await query(`
      MATCH (rt:RoomType {TypeID: $id})
      RETURN 
        rt.TypeID AS type_id,
        rt.TypeID AS TypeID,
        rt.TypeName AS type_name,
        rt.TypeName AS TypeName,
        rt.AC_Type AS ac_type,
        rt.AC_Type AS AC_Type,
        rt.Capacity AS capacity,
        rt.Capacity AS Capacity,
        5000 AS fee_per_month
    `, { id: req.params.id });

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Room type not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching room type by ID:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create room type
router.post('/', async (req, res) => {
  try {
    const { TypeID, type_id, TypeName, type_name, AC_Type, ac_type, Capacity, capacity } = req.body;
    const finalId = TypeID || type_id || ('RT' + (Math.floor(Math.random() * 900) + 10));
    const finalName = TypeName || type_name;

    if (!finalName) {
      return res.status(400).json({ success: false, message: 'Room type name is required' });
    }

    await execute(`
      MERGE (rt:RoomType {TypeID: $typeId})
      SET rt += $props
    `, {
      typeId: finalId,
      props: {
        TypeID: finalId,
        TypeName: finalName,
        AC_Type: AC_Type || ac_type || 'Non-AC',
        Capacity: Number(Capacity || capacity || 1)
      }
    });

    res.status(201).json({ success: true, message: 'Room type created successfully', typeId: finalId });
  } catch (error) {
    console.error('Error creating room type:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT update room type
router.put('/:id', async (req, res) => {
  try {
    const typeId = req.params.id;
    const body = req.body || {};

    const existingRows = await query(`MATCH (rt:RoomType {TypeID: $typeId}) RETURN rt`, { typeId });
    if (existingRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Room type not found' });
    }
    const existing = existingRows[0];

    await execute(`
      MATCH (rt:RoomType {TypeID: $typeId})
      SET rt += $props
    `, {
      typeId,
      props: {
        TypeName: body.TypeName || body.type_name || existing.TypeName,
        AC_Type: body.AC_Type || body.ac_type || existing.AC_Type,
        Capacity: body.Capacity !== undefined ? Number(body.Capacity) : (body.capacity !== undefined ? Number(body.capacity) : existing.Capacity)
      }
    });

    res.json({ success: true, message: 'Room type updated successfully' });
  } catch (error) {
    console.error('Error updating room type:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE room type
router.delete('/:id', async (req, res) => {
  try {
    const typeId = req.params.id;
    await execute(`MATCH (rt:RoomType {TypeID: $typeId}) DETACH DELETE rt`, { typeId });
    res.json({ success: true, message: 'Room type deleted successfully' });
  } catch (error) {
    console.error('Error deleting room type:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
