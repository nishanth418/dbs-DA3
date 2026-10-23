const express = require('express');
const router = express.Router();
const { query, execute, syncRelationships } = require('../database');

// GET all rooms with hostel and type details
router.get('/', async (req, res) => {
  try {
    const { hostel_id, type_id, search } = req.query;

    const cypher = `
      MATCH (r:Room)
      OPTIONAL MATCH (r)-[:LOCATED_IN]->(h:Hostel)
      OPTIONAL MATCH (s:Student)-[:ALLOCATED_ROOM]->(r)
      WHERE ($hostelId IS NULL OR r.HostelID = $hostelId)
        AND ($typeId IS NULL OR r.Type = $typeId OR toLower(r.Type) CONTAINS toLower($typeId))
        AND ($search IS NULL OR toLower(r.RoomNo) CONTAINS toLower($search) 
              OR toLower(coalesce(h.HostelName, '')) CONTAINS toLower($search) 
              OR toLower(r.Type) CONTAINS toLower($search))
      WITH r, h, count(DISTINCT s) AS current_occupants
      RETURN 
        r.RoomNo AS room_id,
        r.RoomNo AS room_number,
        r.RoomNo AS RoomNo,
        r.FloorNo AS floor,
        r.FloorNo AS FloorNo,
        r.Type AS room_type,
        r.Type AS type_name,
        r.Type AS Type,
        r.Capacity AS capacity,
        r.Capacity AS Capacity,
        r.RoomRent AS fee_per_month,
        r.RoomRent AS RoomRent,
        r.HostelID AS hostel_id,
        r.HostelID AS HostelID,
        'Available' AS status,
        coalesce(h.HostelName, 'Unassigned') AS hostel_name,
        'Campus Block' AS hostel_type,
        current_occupants
      ORDER BY h.HostelName ASC, r.FloorNo ASC, r.RoomNo ASC
    `;

    const rows = await query(cypher, {
      hostelId: hostel_id && hostel_id.trim() ? hostel_id.trim() : null,
      typeId: type_id && type_id.trim() ? type_id.trim() : null,
      search: search && search.trim() ? search.trim() : null
    });

    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single room
router.get('/:id', async (req, res) => {
  try {
    const roomId = req.params.id;
    const cypher = `
      MATCH (r:Room {RoomNo: $roomId})
      OPTIONAL MATCH (r)-[:LOCATED_IN]->(h:Hostel)
      RETURN 
        r.RoomNo AS room_id,
        r.RoomNo AS room_number,
        r.RoomNo AS RoomNo,
        r.FloorNo AS floor,
        r.FloorNo AS FloorNo,
        r.Type AS room_type,
        r.Type AS type_name,
        r.Type AS Type,
        r.Capacity AS capacity,
        r.Capacity AS Capacity,
        r.RoomRent AS fee_per_month,
        r.RoomRent AS RoomRent,
        r.HostelID AS hostel_id,
        r.HostelID AS HostelID,
        'Available' AS status,
        coalesce(h.HostelName, 'Unassigned') AS hostel_name
    `;
    const rows = await query(cypher, { roomId });

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    const room = rows[0];
    const students = await query(`
      MATCH (s:Student)-[:ALLOCATED_ROOM]->(r:Room {RoomNo: $roomId})
      RETURN s.StudentID AS student_id, s.FirstName AS first_name, s.LastName AS last_name, s.Email AS email
    `, { roomId });

    res.json({ success: true, data: { ...room, students } });
  } catch (error) {
    console.error('Error fetching room by ID:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create room
router.post('/', async (req, res) => {
  try {
    const { RoomNo, room_number, FloorNo, floor, Type, type, Capacity, capacity, RoomRent, room_rent, HostelID, hostel_id } = req.body;
    const finalRoomNo = RoomNo || room_number;
    const finalHostelId = HostelID || hostel_id;

    if (!finalRoomNo || !finalHostelId) {
      return res.status(400).json({ success: false, message: 'Room number and hostel ID are required' });
    }

    const roomProps = {
      RoomNo: finalRoomNo,
      FloorNo: Number(FloorNo !== undefined ? FloorNo : (floor || 1)),
      Type: Type || type || 'Single Non-AC',
      Capacity: Number(Capacity !== undefined ? Capacity : (capacity || 1)),
      RoomRent: Number(RoomRent !== undefined ? RoomRent : (room_rent || 4000)),
      HostelID: finalHostelId
    };

    await execute(`
      MERGE (r:Room {RoomNo: $roomNo})
      SET r += $props
    `, { roomNo: finalRoomNo, props: roomProps });

    await syncRelationships('Room', roomProps);

    res.status(201).json({ success: true, message: 'Room created successfully', roomId: finalRoomNo });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT update room
router.put('/:id', async (req, res) => {
  try {
    const roomId = req.params.id;
    const body = req.body || {};

    const existingRows = await query(`MATCH (r:Room {RoomNo: $roomId}) RETURN r`, { roomId });
    if (existingRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    const existing = existingRows[0];

    const updatedProps = {
      FloorNo: body.FloorNo !== undefined ? Number(body.FloorNo) : (body.floor !== undefined ? Number(body.floor) : existing.FloorNo),
      Type: body.Type || body.type || body.type_name || existing.Type,
      Capacity: body.Capacity !== undefined ? Number(body.Capacity) : (body.capacity !== undefined ? Number(body.capacity) : existing.Capacity),
      RoomRent: body.RoomRent !== undefined ? Number(body.RoomRent) : (body.room_rent !== undefined ? Number(body.room_rent) : existing.RoomRent),
      HostelID: body.HostelID || body.hostel_id || existing.HostelID
    };

    await execute(`
      MATCH (r:Room {RoomNo: $roomId})
      SET r += $props
    `, { roomId, props: updatedProps });

    await syncRelationships('Room', { RoomNo: roomId, ...updatedProps });

    res.json({ success: true, message: 'Room updated successfully' });
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE room
router.delete('/:id', async (req, res) => {
  try {
    const roomId = req.params.id;
    const studentCount = await query(`
      MATCH (s:Student)-[:ALLOCATED_ROOM]->(r:Room {RoomNo: $roomId})
      RETURN count(s) AS count
    `, { roomId });

    if (studentCount && Number(studentCount[0]?.count || 0) > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete room: ${studentCount[0].count} students are currently assigned to it. Please reassign them first.`
      });
    }

    await execute(`MATCH (r:Room {RoomNo: $roomId}) DETACH DELETE r`, { roomId });
    res.json({ success: true, message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
