const express = require('express');
const router = express.Router();
const { query, execute, syncRelationships } = require('../database');

// GET all hostels with warden info & room count summary
router.get('/', async (req, res) => {
  try {
    const rows = await query(`
      MATCH (h:Hostel)
      OPTIONAL MATCH (h)-[:MANAGED_BY]->(w:Warden)
      OPTIONAL MATCH (r:Room)-[:LOCATED_IN]->(h)
      OPTIONAL MATCH (s:Student)-[:RESIDES_IN]->(h)
      WITH h, w, count(DISTINCT r) AS total_rooms, count(DISTINCT s) AS occupied_rooms, coalesce(sum(r.Capacity), 0) AS total_capacity
      RETURN 
        h.HostelID AS hostel_id,
        h.HostelID AS HostelID,
        h.HostelName AS name,
        h.HostelName AS HostelName,
        h.TotalFloors AS total_floors,
        h.TotalFloors AS TotalFloors,
        h.WardenID AS warden_id,
        h.WardenID AS WardenID,
        'Campus Block' AS type,
        'Campus' AS address,
        w.WardenName AS warden_name,
        w.WardenName AS WardenName,
        w.Email AS warden_email,
        total_rooms,
        occupied_rooms,
        CASE WHEN total_rooms >= occupied_rooms THEN total_rooms - occupied_rooms ELSE 0 END AS available_rooms,
        total_capacity
      ORDER BY h.HostelID ASC
    `);

    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Error fetching hostels:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single hostel
router.get('/:id', async (req, res) => {
  try {
    const hostelId = req.params.id;
    const rows = await query(`
      MATCH (h:Hostel {HostelID: $hostelId})
      OPTIONAL MATCH (h)-[:MANAGED_BY]->(w:Warden)
      RETURN 
        h.HostelID AS hostel_id,
        h.HostelID AS HostelID,
        h.HostelName AS name,
        h.HostelName AS HostelName,
        h.TotalFloors AS total_floors,
        h.TotalFloors AS TotalFloors,
        h.WardenID AS warden_id,
        h.WardenID AS WardenID,
        'Campus Block' AS type,
        'Campus' AS address,
        w.WardenName AS warden_name,
        w.WardenName AS WardenName,
        w.Email AS warden_email
    `, { hostelId });

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Hostel not found' });
    }

    const hostel = rows[0];
    const rooms = await query(`
      MATCH (r:Room {HostelID: $hostelId})
      RETURN 
        r.RoomNo AS room_id,
        r.RoomNo AS room_number,
        r.RoomNo AS RoomNo,
        r.FloorNo AS floor,
        r.FloorNo AS FloorNo,
        r.Type AS room_type,
        r.Type AS Type,
        r.Capacity AS capacity,
        r.Capacity AS Capacity,
        r.RoomRent AS fee_per_month,
        r.RoomRent AS RoomRent,
        r.HostelID AS HostelID
      ORDER BY r.FloorNo ASC, r.RoomNo ASC
    `, { hostelId });

    res.json({ success: true, data: { ...hostel, rooms } });
  } catch (error) {
    console.error('Error fetching hostel by ID:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create hostel
router.post('/', async (req, res) => {
  try {
    const { HostelID, hostel_id, HostelName, name, TotalFloors, total_floors, WardenID, warden_id } = req.body;
    const finalId = HostelID || hostel_id || ('H' + (Math.floor(Math.random() * 900) + 10));
    const finalName = HostelName || name;
    if (!finalName) {
      return res.status(400).json({ success: false, message: 'Hostel name is required' });
    }

    const hostelProps = {
      HostelID: finalId,
      HostelName: finalName,
      TotalFloors: Number(TotalFloors || total_floors || 3),
      WardenID: WardenID || warden_id || null
    };

    await execute(`
      MERGE (h:Hostel {HostelID: $hostelId})
      SET h += $props
    `, { hostelId: finalId, props: hostelProps });

    await syncRelationships('Hostel', hostelProps);

    res.status(201).json({ success: true, message: 'Hostel created successfully', hostelId: finalId });
  } catch (error) {
    console.error('Error creating hostel:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT update hostel
router.put('/:id', async (req, res) => {
  try {
    const hostelId = req.params.id;
    const { HostelName, name, TotalFloors, total_floors, WardenID, warden_id } = req.body;

    const existingRows = await query(`MATCH (h:Hostel {HostelID: $hostelId}) RETURN h`, { hostelId });
    if (existingRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Hostel not found' });
    }
    const existing = existingRows[0];

    const updatedProps = {
      HostelName: HostelName || name || existing.HostelName,
      TotalFloors: TotalFloors !== undefined ? Number(TotalFloors) : (total_floors !== undefined ? Number(total_floors) : existing.TotalFloors),
      WardenID: WardenID || warden_id || existing.WardenID
    };

    await execute(`
      MATCH (h:Hostel {HostelID: $hostelId})
      SET h += $props
    `, { hostelId, props: updatedProps });

    await syncRelationships('Hostel', { HostelID: hostelId, ...updatedProps });

    res.json({ success: true, message: 'Hostel updated successfully' });
  } catch (error) {
    console.error('Error updating hostel:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE hostel
router.delete('/:id', async (req, res) => {
  try {
    const hostelId = req.params.id;
    const roomCount = await query(`
      MATCH (r:Room)-[:LOCATED_IN]->(h:Hostel {HostelID: $hostelId})
      RETURN count(r) AS count
    `, { hostelId });

    if (roomCount && Number(roomCount[0]?.count || 0) > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete hostel: it currently contains ${roomCount[0].count} rooms. Please reassign or delete rooms first.`
      });
    }

    await execute(`MATCH (h:Hostel {HostelID: $hostelId}) DETACH DELETE h`, { hostelId });
    res.json({ success: true, message: 'Hostel deleted successfully' });
  } catch (error) {
    console.error('Error deleting hostel:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
