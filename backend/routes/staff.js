const express = require('express');
const router = express.Router();
const { query, execute, syncRelationships } = require('../database');

// GET all staff with phones and mess info
router.get('/', async (req, res) => {
  try {
    const { role, mess_id, search } = req.query;

    const cypher = `
      MATCH (st:Staff)
      OPTIONAL MATCH (st)-[:ASSIGNED_TO]->(m:Mess)
      OPTIONAL MATCH (st)-[:HAS_PHONE]->(sp:StaffPhone)
      WHERE ($role IS NULL OR st.Role = $role)
        AND ($messId IS NULL OR st.MessID = $messId)
        AND ($search IS NULL OR toLower(st.StaffName) CONTAINS toLower($search) 
              OR toLower(st.Role) CONTAINS toLower($search))
      WITH st, m, collect(DISTINCT sp.PhoneNo) AS phonesList
      RETURN 
        st.StaffID AS staff_id,
        st.StaffID AS StaffID,
        st.StaffName AS name,
        st.StaffName AS StaffName,
        st.JoinDate AS join_date,
        st.JoinDate AS JoinDate,
        st.Salary AS salary,
        st.Salary AS Salary,
        st.Role AS role,
        st.Role AS Role,
        st.MessID AS mess_id,
        st.MessID AS MessID,
        coalesce(m.MessName, 'Unassigned') AS mess_name,
        reduce(acc = '', p IN phonesList | CASE WHEN acc = '' THEN p ELSE acc + ', ' + p END) AS phone_numbers
      ORDER BY st.StaffID ASC
    `;

    const rows = await query(cypher, {
      role: role && role.trim() ? role.trim() : null,
      messId: mess_id && mess_id.trim() ? mess_id.trim() : null,
      search: search && search.trim() ? search.trim() : null
    });

    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Error fetching staff list:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single staff
router.get('/:id', async (req, res) => {
  try {
    const staffId = req.params.id;
    const cypher = `
      MATCH (st:Staff {StaffID: $staffId})
      OPTIONAL MATCH (st)-[:ASSIGNED_TO]->(m:Mess)
      OPTIONAL MATCH (st)-[:HAS_PHONE]->(sp:StaffPhone)
      WITH st, m, collect(DISTINCT sp.PhoneNo) AS phones
      RETURN 
        st.StaffID AS staff_id,
        st.StaffID AS StaffID,
        st.StaffName AS name,
        st.StaffName AS StaffName,
        st.JoinDate AS join_date,
        st.JoinDate AS JoinDate,
        st.Salary AS salary,
        st.Salary AS Salary,
        st.Role AS role,
        st.Role AS Role,
        st.MessID AS mess_id,
        st.MessID AS MessID,
        coalesce(m.MessName, 'Unassigned') AS mess_name,
        phones
    `;
    const rows = await query(cypher, { staffId });

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching staff member by ID:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create staff
router.post('/', async (req, res) => {
  try {
    const { StaffID, staff_id, StaffName, name, JoinDate, join_date, Salary, salary, Role, role, MessID, mess_id, phones } = req.body;
    const finalId = StaffID || staff_id || ('ST' + (Math.floor(Math.random() * 90) + 10));
    const finalName = StaffName || name;
    if (!finalName) {
      return res.status(400).json({ success: false, message: 'Staff name is required' });
    }

    const staffProps = {
      StaffID: finalId,
      StaffName: finalName,
      JoinDate: JoinDate || join_date || '01-JAN-22',
      Salary: Number(Salary !== undefined ? Salary : (salary || 25000)),
      Role: Role || role || 'Support Staff',
      MessID: MessID || mess_id || null
    };

    await execute(`
      MERGE (st:Staff {StaffID: $staffId})
      SET st += $props
    `, { staffId: finalId, props: staffProps });

    if (phones && Array.isArray(phones)) {
      for (const p of phones) {
        if (p && String(p).trim()) {
          await execute(`
            MERGE (sp:StaffPhone {StaffID: $staffId, PhoneNo: $phoneNo})
            WITH sp
            MATCH (st:Staff {StaffID: $staffId})
            MERGE (st)-[:HAS_PHONE]->(sp)
          `, { staffId: finalId, phoneNo: String(p).trim() });
        }
      }
    }

    await syncRelationships('Staff', staffProps);

    res.status(201).json({ success: true, message: 'Staff member created successfully', staffId: finalId });
  } catch (error) {
    console.error('Error creating staff member:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT update staff
router.put('/:id', async (req, res) => {
  try {
    const staffId = req.params.id;
    const body = req.body || {};

    const existingRows = await query(`MATCH (st:Staff {StaffID: $staffId}) RETURN st`, { staffId });
    if (existingRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }
    const existing = existingRows[0];

    const updatedProps = {
      StaffName: body.StaffName || body.name || existing.StaffName,
      JoinDate: body.JoinDate || body.join_date || existing.JoinDate,
      Salary: body.Salary !== undefined ? Number(body.Salary) : (body.salary !== undefined ? Number(body.salary) : existing.Salary),
      Role: body.Role || body.role || existing.Role,
      MessID: body.MessID || body.mess_id || existing.MessID
    };

    await execute(`
      MATCH (st:Staff {StaffID: $staffId})
      SET st += $props
    `, { staffId, props: updatedProps });

    if (body.phones && Array.isArray(body.phones)) {
      await execute(`
        MATCH (st:Staff {StaffID: $staffId})-[r:HAS_PHONE]->(sp:StaffPhone)
        DETACH DELETE sp
      `, { staffId });

      for (const p of body.phones) {
        if (p && String(p).trim()) {
          await execute(`
            MERGE (sp:StaffPhone {StaffID: $staffId, PhoneNo: $phoneNo})
            WITH sp
            MATCH (st:Staff {StaffID: $staffId})
            MERGE (st)-[:HAS_PHONE]->(sp)
          `, { staffId, phoneNo: String(p).trim() });
        }
      }
    }

    await syncRelationships('Staff', { StaffID: staffId, ...updatedProps });

    res.json({ success: true, message: 'Staff member updated successfully' });
  } catch (error) {
    console.error('Error updating staff member:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE staff
router.delete('/:id', async (req, res) => {
  try {
    const staffId = req.params.id;
    await execute(`
      MATCH (st:Staff {StaffID: $staffId})
      OPTIONAL MATCH (st)-[:HAS_PHONE]->(sp:StaffPhone)
      DETACH DELETE st, sp
    `, { staffId });
    res.json({ success: true, message: 'Staff member deleted successfully' });
  } catch (error) {
    console.error('Error deleting staff member:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
