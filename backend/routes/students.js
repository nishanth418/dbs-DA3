const express = require('express');
const router = express.Router();
const { query, execute, syncRelationships } = require('../database');

// GET all students
router.get('/', async (req, res) => {
  try {
    const { search, hostel_id, status } = req.query;

    const cypher = `
      MATCH (s:Student)
      OPTIONAL MATCH (s)-[:ALLOCATED_ROOM]->(r:Room)
      OPTIONAL MATCH (s)-[:RESIDES_IN]->(h:Hostel)
      OPTIONAL MATCH (r)-[:HAS_TYPE]->(rt:RoomType)
      OPTIONAL MATCH (s)-[:HAS_PHONE]->(sp:StudentPhone)
      WHERE ($search IS NULL OR toLower(s.FirstName) CONTAINS toLower($search) 
              OR toLower(s.LastName) CONTAINS toLower($search) 
              OR toLower(s.Email) CONTAINS toLower($search) 
              OR toLower(s.RoomNo) CONTAINS toLower($search))
        AND ($hostelId IS NULL OR s.HostelID = $hostelId)
        AND ($status IS NULL OR s.PlanType = $status)
      WITH s, r, h, rt, collect(DISTINCT sp.PhoneNo) AS phonesList
      RETURN 
        s.StudentID AS student_id,
        s.StudentID AS StudentID,
        s.FirstName AS first_name,
        s.FirstName AS FirstName,
        s.LastName AS last_name,
        s.LastName AS LastName,
        s.Gender AS gender,
        s.Gender AS Gender,
        s.DOB AS dob,
        s.DOB AS DOB,
        s.Email AS email,
        s.Email AS Email,
        s.BloodGroup AS blood_group,
        s.BloodGroup AS BloodGroup,
        s.AllergyInfo AS allergy_info,
        s.AllergyInfo AS AllergyInfo,
        s.PlanType AS plan_type,
        s.PlanType AS PlanType,
        s.PlanType AS status,
        s.RoomNo AS room_number,
        s.RoomNo AS room_id,
        s.RoomNo AS RoomNo,
        s.HostelID AS hostel_id,
        s.HostelID AS HostelID,
        s.MessID AS mess_id,
        s.MessID AS MessID,
        s.MentorStudentID AS mentor_student_id,
        s.MentorStudentID AS MentorStudentID,
        r.FloorNo AS floor,
        r.FloorNo AS FloorNo,
        h.HostelName AS hostel_name,
        h.HostelName AS HostelName,
        rt.TypeName AS room_type_name,
        r.RoomRent AS fee_per_month,
        reduce(acc = '', p IN phonesList | CASE WHEN acc = '' THEN p ELSE acc + ', ' + p END) AS phone_numbers
      ORDER BY s.StudentID ASC
    `;

    const rows = await query(cypher, {
      search: search && search.trim() ? search.trim() : null,
      hostelId: hostel_id && hostel_id.trim() ? hostel_id.trim() : null,
      status: status && status.trim() ? status.trim() : null
    });

    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single student
router.get('/:id', async (req, res) => {
  try {
    const studentId = req.params.id;
    const cypher = `
      MATCH (s:Student {StudentID: $studentId})
      OPTIONAL MATCH (s)-[:ALLOCATED_ROOM]->(r:Room)
      OPTIONAL MATCH (s)-[:RESIDES_IN]->(h:Hostel)
      OPTIONAL MATCH (r)-[:HAS_TYPE]->(rt:RoomType)
      OPTIONAL MATCH (s)-[:HAS_PHONE]->(sp:StudentPhone)
      WITH s, r, h, rt, collect(DISTINCT sp.PhoneNo) AS phones
      RETURN 
        s.StudentID AS student_id,
        s.StudentID AS StudentID,
        s.FirstName AS first_name,
        s.FirstName AS FirstName,
        s.LastName AS last_name,
        s.LastName AS LastName,
        s.Gender AS gender,
        s.Gender AS Gender,
        s.DOB AS dob,
        s.DOB AS DOB,
        s.Email AS email,
        s.Email AS Email,
        s.BloodGroup AS blood_group,
        s.BloodGroup AS BloodGroup,
        s.AllergyInfo AS allergy_info,
        s.AllergyInfo AS AllergyInfo,
        s.PlanType AS plan_type,
        s.PlanType AS PlanType,
        s.PlanType AS status,
        s.RoomNo AS room_number,
        s.RoomNo AS room_id,
        s.RoomNo AS RoomNo,
        s.HostelID AS hostel_id,
        s.HostelID AS HostelID,
        s.MessID AS mess_id,
        s.MessID AS MessID,
        s.MentorStudentID AS mentor_student_id,
        s.MentorStudentID AS MentorStudentID,
        r.FloorNo AS floor,
        r.FloorNo AS FloorNo,
        h.HostelName AS hostel_name,
        h.HostelName AS HostelName,
        rt.TypeName AS room_type_name,
        r.RoomRent AS fee_per_month,
        phones
    `;
    const rows = await query(cypher, { studentId });

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching student by ID:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST new student
router.post('/', async (req, res) => {
  try {
    const {
      StudentID,
      student_id,
      FirstName,
      first_name,
      LastName,
      last_name,
      Gender,
      gender,
      DOB,
      dob,
      Email,
      email,
      BloodGroup,
      blood_group,
      AllergyInfo,
      allergy_info,
      PlanType,
      plan_type,
      RoomNo,
      room_id,
      room_number,
      HostelID,
      hostel_id,
      MessID,
      mess_id,
      MentorStudentID,
      mentor_student_id,
      phones
    } = req.body;

    const finalId = StudentID || student_id || ('S' + (1000 + Math.floor(Math.random() * 9000)));
    const finalFirstName = FirstName || first_name || '';
    const finalLastName = LastName || last_name || '';
    const finalEmail = Email || email || '';

    if (!finalFirstName || !finalLastName) {
      return res.status(400).json({ success: false, message: 'First and last name are required' });
    }

    const studentProps = {
      StudentID: finalId,
      FirstName: finalFirstName,
      LastName: finalLastName,
      Gender: Gender || gender || 'Male',
      DOB: DOB || dob || '2004-01-01',
      Email: finalEmail,
      BloodGroup: BloodGroup || blood_group || 'O+',
      AllergyInfo: AllergyInfo || allergy_info || 'None',
      PlanType: PlanType || plan_type || 'Standard',
      RoomNo: RoomNo || room_number || room_id || null,
      HostelID: HostelID || hostel_id || null,
      MessID: MessID || mess_id || null,
      MentorStudentID: MentorStudentID || mentor_student_id || null
    };

    await execute(`
      MERGE (s:Student {StudentID: $StudentID})
      SET s += $props
    `, {
      StudentID: finalId,
      props: studentProps
    });

    if (phones && Array.isArray(phones)) {
      for (const phone of phones) {
        if (phone && String(phone).trim()) {
          await execute(`
            MERGE (sp:StudentPhone {StudentID: $studentId, PhoneNo: $phoneNo})
            WITH sp
            MATCH (s:Student {StudentID: $studentId})
            MERGE (s)-[:HAS_PHONE]->(sp)
          `, { studentId: finalId, phoneNo: String(phone).trim() });
        }
      }
    }

    await syncRelationships('Student', studentProps);

    res.status(201).json({ success: true, message: 'Student created successfully', studentId: finalId });
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT update student
router.put('/:id', async (req, res) => {
  try {
    const studentId = req.params.id;
    const body = req.body || {};

    const existingRows = await query(`MATCH (s:Student {StudentID: $studentId}) RETURN s`, { studentId });
    if (existingRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    const existing = existingRows[0];

    const updatedProps = {
      FirstName: body.FirstName || body.first_name || existing.FirstName,
      LastName: body.LastName || body.last_name || existing.LastName,
      Gender: body.Gender || body.gender || existing.Gender,
      DOB: body.DOB || body.dob || existing.DOB,
      Email: body.Email || body.email || existing.Email,
      BloodGroup: body.BloodGroup !== undefined ? (body.BloodGroup || body.blood_group) : existing.BloodGroup,
      AllergyInfo: body.AllergyInfo !== undefined ? (body.AllergyInfo || body.allergy_info) : existing.AllergyInfo,
      PlanType: body.PlanType || body.plan_type || body.status || existing.PlanType,
      RoomNo: body.RoomNo || body.room_number || body.room_id || existing.RoomNo,
      HostelID: body.HostelID || body.hostel_id || existing.HostelID,
      MessID: body.MessID || body.mess_id || existing.MessID,
      MentorStudentID: body.MentorStudentID || body.mentor_student_id || existing.MentorStudentID
    };

    await execute(`
      MATCH (s:Student {StudentID: $studentId})
      SET s += $props
    `, {
      studentId,
      props: updatedProps
    });

    if (body.phones && Array.isArray(body.phones)) {
      await execute(`
        MATCH (s:Student {StudentID: $studentId})-[r:HAS_PHONE]->(sp:StudentPhone)
        DETACH DELETE sp
      `, { studentId });

      for (const phone of body.phones) {
        if (phone && String(phone).trim()) {
          await execute(`
            MERGE (sp:StudentPhone {StudentID: $studentId, PhoneNo: $phoneNo})
            WITH sp
            MATCH (s:Student {StudentID: $studentId})
            MERGE (s)-[:HAS_PHONE]->(sp)
          `, { studentId, phoneNo: String(phone).trim() });
        }
      }
    }

    await syncRelationships('Student', { StudentID: studentId, ...updatedProps });

    res.json({ success: true, message: 'Student updated successfully' });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE student
router.delete('/:id', async (req, res) => {
  try {
    const studentId = req.params.id;
    const existing = await query(`MATCH (s:Student {StudentID: $studentId}) RETURN s`, { studentId });
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const paymentCount = await query(`
      MATCH (s:Student {StudentID: $studentId})-[:MADE_PAYMENT]->(p:Payment)
      RETURN count(p) AS count
    `, { studentId });

    if (paymentCount && Number(paymentCount[0]?.count || 0) > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete student with ${paymentCount[0].count} existing payment records. Foreign key protection active.`
      });
    }

    await execute(`
      MATCH (s:Student {StudentID: $studentId})
      OPTIONAL MATCH (s)-[:HAS_PHONE]->(sp:StudentPhone)
      DETACH DELETE s, sp
    `, { studentId });

    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
