const express = require('express');
const router = express.Router();
const { query, execute } = require('../database');

// GET all mess facilities with contacts
router.get('/', async (req, res) => {
  try {
    const rows = await query(`
      MATCH (m:Mess)
      OPTIONAL MATCH (m)-[:HAS_CONTACT]->(mc:MessContact)
      OPTIONAL MATCH (ml:Meal)-[:SERVED_AT]->(m)
      OPTIONAL MATCH (st:Staff)-[:ASSIGNED_TO]->(m)
      WITH m, collect(DISTINCT mc.ContactNo) AS contactsList, count(DISTINCT ml) AS total_meals_scheduled, count(DISTINCT st) AS staff_count
      RETURN 
        m.MessID AS mess_id,
        m.MessID AS MessID,
        m.MessName AS mess_name,
        m.MessName AS name,
        m.MessName AS MessName,
        m.MessType AS type,
        m.MessType AS mess_type,
        m.MessType AS MessType,
        m.Location AS location,
        m.Location AS Location,
        reduce(acc = '', c IN contactsList | CASE WHEN acc = '' THEN c ELSE acc + ', ' + c END) AS contact_numbers,
        total_meals_scheduled,
        staff_count
      ORDER BY m.MessID ASC
    `);

    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Error fetching mess list:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single mess
router.get('/:id', async (req, res) => {
  try {
    const messId = req.params.id;
    const rows = await query(`
      MATCH (m:Mess {MessID: $messId})
      RETURN 
        m.MessID AS mess_id,
        m.MessID AS MessID,
        m.MessName AS mess_name,
        m.MessName AS name,
        m.MessName AS MessName,
        m.MessType AS type,
        m.MessType AS mess_type,
        m.MessType AS MessType,
        m.Location AS location,
        m.Location AS Location
    `, { messId });

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Mess not found' });
    }

    const mess = rows[0];
    const contactRows = await query(`
      MATCH (m:Mess {MessID: $messId})-[:HAS_CONTACT]->(mc:MessContact)
      RETURN mc.ContactNo AS contact_number
    `, { messId });
    const contacts = contactRows.map(c => c.contact_number);

    const meals = await query(`
      MATCH (ml:Meal)-[:SERVED_AT]->(m:Mess {MessID: $messId})
      RETURN ml.MealID AS meal_id, ml.MealName AS meal_name, ml.Description AS description, ml.Cost AS cost
    `, { messId });

    const staff = await query(`
      MATCH (st:Staff)-[:ASSIGNED_TO]->(m:Mess {MessID: $messId})
      RETURN st.StaffID AS staff_id, st.StaffName AS name, st.Role AS role
    `, { messId });

    res.json({ success: true, data: { ...mess, contacts, meals, staff } });
  } catch (error) {
    console.error('Error fetching mess by ID:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create mess
router.post('/', async (req, res) => {
  try {
    const { MessID, mess_id, MessName, mess_name, name, MessType, type, mess_type, Location, location, contacts } = req.body;
    const finalId = MessID || mess_id || ('M' + (Math.floor(Math.random() * 90) + 10));
    const finalName = MessName || mess_name || name;
    if (!finalName) {
      return res.status(400).json({ success: false, message: 'Mess name is required' });
    }

    const messProps = {
      MessID: finalId,
      MessName: finalName,
      MessType: MessType || type || mess_type || 'Mixed',
      Location: Location || location || 'Campus Block'
    };

    await execute(`
      MERGE (m:Mess {MessID: $messId})
      SET m += $props
    `, { messId: finalId, props: messProps });

    if (contacts && Array.isArray(contacts)) {
      for (const c of contacts) {
        if (c && String(c).trim()) {
          await execute(`
            MERGE (mc:MessContact {MessID: $messId, ContactNo: $contactNo})
            WITH mc
            MATCH (m:Mess {MessID: $messId})
            MERGE (m)-[:HAS_CONTACT]->(mc)
          `, { messId: finalId, contactNo: String(c).trim() });
        }
      }
    }

    res.status(201).json({ success: true, message: 'Mess created successfully', messId: finalId });
  } catch (error) {
    console.error('Error creating mess:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT update mess
router.put('/:id', async (req, res) => {
  try {
    const messId = req.params.id;
    const body = req.body || {};

    const existingRows = await query(`MATCH (m:Mess {MessID: $messId}) RETURN m`, { messId });
    if (existingRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Mess not found' });
    }
    const existing = existingRows[0];

    const updatedProps = {
      MessName: body.MessName || body.mess_name || body.name || existing.MessName,
      MessType: body.MessType || body.type || body.mess_type || existing.MessType,
      Location: body.Location || body.location || existing.Location
    };

    await execute(`
      MATCH (m:Mess {MessID: $messId})
      SET m += $props
    `, { messId, props: updatedProps });

    if (body.contacts && Array.isArray(body.contacts)) {
      await execute(`
        MATCH (m:Mess {MessID: $messId})-[r:HAS_CONTACT]->(mc:MessContact)
        DETACH DELETE mc
      `, { messId });

      for (const c of body.contacts) {
        if (c && String(c).trim()) {
          await execute(`
            MERGE (mc:MessContact {MessID: $messId, ContactNo: $contactNo})
            WITH mc
            MATCH (m:Mess {MessID: $messId})
            MERGE (m)-[:HAS_CONTACT]->(mc)
          `, { messId, contactNo: String(c).trim() });
        }
      }
    }

    res.json({ success: true, message: 'Mess updated successfully' });
  } catch (error) {
    console.error('Error updating mess:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE mess
router.delete('/:id', async (req, res) => {
  try {
    const messId = req.params.id;
    await execute(`
      MATCH (m:Mess {MessID: $messId})
      OPTIONAL MATCH (m)-[:HAS_CONTACT]->(mc:MessContact)
      DETACH DELETE m, mc
    `, { messId });
    res.json({ success: true, message: 'Mess deleted successfully' });
  } catch (error) {
    console.error('Error deleting mess:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
