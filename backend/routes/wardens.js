const express = require('express');
const router = express.Router();
const { query, execute, syncRelationships } = require('../database');

// GET all wardens with phone numbers and assigned hostel
router.get('/', async (req, res) => {
  try {
    const rows = await query(`
      MATCH (w:Warden)
      OPTIONAL MATCH (h:Hostel)-[:MANAGED_BY]->(w)
      OPTIONAL MATCH (w)-[:HAS_PHONE]->(wp:WardenPhone)
      WITH w, h, collect(DISTINCT wp.PhoneNo) AS phonesList
      RETURN 
        w.WardenID AS warden_id,
        w.WardenID AS WardenID,
        w.WardenName AS name,
        w.WardenName AS WardenName,
        w.Email AS email,
        w.Email AS Email,
        w.JoiningDate AS join_date,
        w.JoiningDate AS JoiningDate,
        coalesce(h.HostelName, null) AS hostel_name,
        coalesce(h.HostelID, null) AS hostel_id,
        reduce(acc = '', p IN phonesList | CASE WHEN acc = '' THEN p ELSE acc + ', ' + p END) AS phone_numbers
      ORDER BY w.WardenID ASC
    `);

    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Error fetching wardens:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single warden
router.get('/:id', async (req, res) => {
  try {
    const wardenId = req.params.id;
    const rows = await query(`
      MATCH (w:Warden {WardenID: $wardenId})
      OPTIONAL MATCH (h:Hostel)-[:MANAGED_BY]->(w)
      OPTIONAL MATCH (w)-[:HAS_PHONE]->(wp:WardenPhone)
      WITH w, h, collect(DISTINCT wp.PhoneNo) AS phones
      RETURN 
        w.WardenID AS warden_id,
        w.WardenID AS WardenID,
        w.WardenName AS name,
        w.WardenName AS WardenName,
        w.Email AS email,
        w.Email AS Email,
        w.JoiningDate AS join_date,
        w.JoiningDate AS JoiningDate,
        coalesce(h.HostelName, null) AS hostel_name,
        coalesce(h.HostelID, null) AS hostel_id,
        phones
    `, { wardenId });

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Warden not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching warden by ID:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create warden
router.post('/', async (req, res) => {
  try {
    const { WardenID, warden_id, WardenName, name, Email, email, JoiningDate, join_date, phones } = req.body;
    const finalId = WardenID || warden_id || ('W' + (100 + Math.floor(Math.random() * 900)));
    const finalName = WardenName || name;
    if (!finalName) {
      return res.status(400).json({ success: false, message: 'Warden name is required' });
    }

    const wardenProps = {
      WardenID: finalId,
      WardenName: finalName,
      Email: Email || email || '',
      JoiningDate: JoiningDate || join_date || '01-JAN-22'
    };

    await execute(`
      MERGE (w:Warden {WardenID: $wardenId})
      SET w += $props
    `, { wardenId: finalId, props: wardenProps });

    if (phones && Array.isArray(phones)) {
      for (const phone of phones) {
        if (phone && String(phone).trim()) {
          await execute(`
            MERGE (wp:WardenPhone {WardenID: $wardenId, PhoneNo: $phoneNo})
            WITH wp
            MATCH (w:Warden {WardenID: $wardenId})
            MERGE (w)-[:HAS_PHONE]->(wp)
          `, { wardenId: finalId, phoneNo: String(phone).trim() });
        }
      }
    }

    res.status(201).json({ success: true, message: 'Warden created successfully', wardenId: finalId });
  } catch (error) {
    console.error('Error creating warden:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT update warden
router.put('/:id', async (req, res) => {
  try {
    const wardenId = req.params.id;
    const body = req.body || {};

    const existingRows = await query(`MATCH (w:Warden {WardenID: $wardenId}) RETURN w`, { wardenId });
    if (existingRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Warden not found' });
    }
    const existing = existingRows[0];

    const updatedProps = {
      WardenName: body.WardenName || body.name || existing.WardenName,
      Email: body.Email || body.email || existing.Email,
      JoiningDate: body.JoiningDate || body.join_date || existing.JoiningDate
    };

    await execute(`
      MATCH (w:Warden {WardenID: $wardenId})
      SET w += $props
    `, { wardenId, props: updatedProps });

    if (body.phones && Array.isArray(body.phones)) {
      await execute(`
        MATCH (w:Warden {WardenID: $wardenId})-[r:HAS_PHONE]->(wp:WardenPhone)
        DETACH DELETE wp
      `, { wardenId });

      for (const phone of body.phones) {
        if (phone && String(phone).trim()) {
          await execute(`
            MERGE (wp:WardenPhone {WardenID: $wardenId, PhoneNo: $phoneNo})
            WITH wp
            MATCH (w:Warden {WardenID: $wardenId})
            MERGE (w)-[:HAS_PHONE]->(wp)
          `, { wardenId, phoneNo: String(phone).trim() });
        }
      }
    }

    res.json({ success: true, message: 'Warden updated successfully' });
  } catch (error) {
    console.error('Error updating warden:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE warden
router.delete('/:id', async (req, res) => {
  try {
    const wardenId = req.params.id;
    const hostelCount = await query(`
      MATCH (h:Hostel)-[:MANAGED_BY]->(w:Warden {WardenID: $wardenId})
      RETURN count(h) AS count
    `, { wardenId });

    if (hostelCount && Number(hostelCount[0]?.count || 0) > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete warden: assigned to ${hostelCount[0].count} hostel(s). Reassign hostel first.`
      });
    }

    await execute(`
      MATCH (w:Warden {WardenID: $wardenId})
      OPTIONAL MATCH (w)-[:HAS_PHONE]->(wp:WardenPhone)
      DETACH DELETE w, wp
    `, { wardenId });

    res.json({ success: true, message: 'Warden deleted successfully' });
  } catch (error) {
    console.error('Error deleting warden:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
