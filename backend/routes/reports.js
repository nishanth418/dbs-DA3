const express = require('express');
const router = express.Router();
const { query } = require('../database');

const REPORT_DEFINITIONS = {
  'student-room-hostel': {
    title: '1. Student + Room + Hostel Report',
    description: 'Detailed allocation listing of students with their assigned rooms, floors, and hostels.',
    cypher: `
      MATCH (s:Student)
      OPTIONAL MATCH (s)-[:ALLOCATED_ROOM]->(r:Room)
      OPTIONAL MATCH (s)-[:RESIDES_IN]->(h:Hostel)
      RETURN 
        s.StudentID AS StudentID,
        s.FirstName + ' ' + s.LastName AS StudentName,
        s.Email AS Email,
        s.Gender AS Gender,
        s.PlanType AS PlanType,
        coalesce(r.RoomNo, 'Unassigned') AS RoomNo,
        coalesce(r.FloorNo, 0) AS FloorNo,
        coalesce(h.HostelName, 'Unassigned') AS HostelName
      ORDER BY s.StudentID ASC
    `
  },
  'student-phones': {
    title: '2. Student + Student Phone Report',
    description: 'Multi-phone contact registry mapping all contact numbers per student.',
    cypher: `
      MATCH (s:Student)-[:HAS_PHONE]->(sp:StudentPhone)
      RETURN 
        s.StudentID AS StudentID,
        s.FirstName + ' ' + s.LastName AS StudentName,
        s.Email AS Email,
        sp.PhoneNo AS PhoneNo
      ORDER BY s.StudentID ASC, sp.PhoneNo ASC
    `
  },
  'hostel-warden': {
    title: '3. Hostel + Warden Report',
    description: 'Administrative hierarchy connecting each hostel building to its presiding warden and phone numbers.',
    cypher: `
      MATCH (h:Hostel)
      OPTIONAL MATCH (h)-[:MANAGED_BY]->(w:Warden)
      OPTIONAL MATCH (w)-[:HAS_PHONE]->(wp:WardenPhone)
      WITH h, w, collect(DISTINCT wp.PhoneNo) AS phones
      RETURN 
        h.HostelID AS HostelID,
        h.HostelName AS HostelName,
        h.TotalFloors AS TotalFloors,
        w.WardenID AS WardenID,
        coalesce(w.WardenName, 'No Warden Assigned') AS WardenName,
        coalesce(w.Email, '-') AS WardenEmail,
        reduce(acc = '', p IN phones | CASE WHEN acc = '' THEN p ELSE acc + ', ' + p END) AS WardenPhones
      ORDER BY h.HostelID ASC
    `
  },
  'room-type-hostel': {
    title: '4. Room + Hostel Report',
    description: 'Inventory of all rooms with room configurations, bed capacities, room rents, and hostel locations.',
    cypher: `
      MATCH (r:Room)-[:LOCATED_IN]->(h:Hostel)
      RETURN 
        r.RoomNo AS RoomNo,
        r.FloorNo AS FloorNo,
        r.Type AS RoomType,
        r.Capacity AS Capacity,
        r.RoomRent AS RoomRent,
        h.HostelName AS HostelName
      ORDER BY h.HostelName ASC, r.FloorNo ASC, r.RoomNo ASC
    `
  },
  'mess-meal': {
    title: '5. Mess + Meal Report',
    description: 'Meal menus, descriptions, and costs across all mess halls.',
    cypher: `
      MATCH (ml:Meal)-[:SERVED_AT]->(m:Mess)
      RETURN 
        m.MessID AS MessID,
        m.MessName AS MessName,
        m.MessType AS MessType,
        m.Location AS Location,
        ml.MealID AS MealID,
        ml.MealName AS MealName,
        ml.Description AS Description,
        ml.Cost AS Cost
      ORDER BY m.MessID ASC, ml.MealID ASC
    `
  },
  'mess-staff': {
    title: '6. Mess + Staff Report',
    description: 'Kitchen and service personnel assigned to each mess hall with roles and contacts.',
    cypher: `
      MATCH (st:Staff)-[:ASSIGNED_TO]->(m:Mess)
      OPTIONAL MATCH (st)-[:HAS_PHONE]->(sp:StaffPhone)
      WITH m, st, collect(DISTINCT sp.PhoneNo) AS phones
      RETURN 
        m.MessID AS MessID,
        m.MessName AS MessName,
        st.StaffID AS StaffID,
        st.StaffName AS StaffName,
        st.Role AS Role,
        st.Salary AS Salary,
        reduce(acc = '', p IN phones | CASE WHEN acc = '' THEN p ELSE acc + ', ' + p END) AS StaffPhones
      ORDER BY m.MessName ASC, st.Role ASC, st.StaffName ASC
    `
  },
  'supplier-inventory': {
    title: '7. Supplier + Inventory Report',
    description: 'Matrix of verified vendors and the inventory items procured.',
    cypher: `
      MATCH (sup:Supplier)<-[:FROM_SUPPLIER]-(p:Procures)-[:OF_ITEM]->(i:InventoryItem)
      RETURN 
        sup.SupplierID AS SupplierID,
        sup.SupplierName AS SupplierName,
        i.ItemID AS ItemID,
        i.ItemName AS ItemName,
        i.Category AS Category,
        i.Unit AS Unit,
        p.Quantity AS Quantity
      ORDER BY sup.SupplierName ASC, i.ItemName ASC
    `
  },
  'procurement-supplier-inventory': {
    title: '8. Procurement + Supplier + Inventory Report',
    description: 'Purchase ledger linking procurement quantities to mess halls, vendors, and items.',
    cypher: `
      MATCH (m:Mess)-[:PROCURES]->(p:Procures)-[:FROM_SUPPLIER]->(sup:Supplier),
            (p)-[:OF_ITEM]->(i:InventoryItem)
      RETURN 
        m.MessName AS MessName,
        sup.SupplierName AS SupplierName,
        i.ItemName AS ItemName,
        i.Category AS Category,
        p.Quantity AS Quantity,
        i.Unit AS Unit
      ORDER BY m.MessName ASC, sup.SupplierName ASC
    `
  },
  'student-payment': {
    title: '9. Student + Payment Report',
    description: 'Complete fee payment transactions joined with student records.',
    cypher: `
      MATCH (s:Student)-[:MADE_PAYMENT]->(p:Payment)
      OPTIONAL MATCH (s)-[:RESIDES_IN]->(h:Hostel)
      RETURN 
        p.PaymentID AS PaymentID,
        p.Amount AS Amount,
        p.PaymentMode AS PaymentMode,
        p.Status AS Status,
        toString(p.PaymentDay) + '-' + toString(p.PaymentMonth) + '-' + toString(p.PaymentYear) AS PaymentDate,
        s.StudentID AS StudentID,
        s.FirstName + ' ' + s.LastName AS StudentName,
        s.Email AS Email,
        s.RoomNo AS RoomNo,
        coalesce(h.HostelName, 'Unassigned') AS HostelName
      ORDER BY p.PaymentID ASC
    `
  },
  'hostel-occupancy': {
    title: '10. Overall Hostel Occupancy Report',
    description: 'High-level aggregation of hostels, total rooms, and bed capacity.',
    cypher: `
      MATCH (h:Hostel)
      OPTIONAL MATCH (r:Room)-[:LOCATED_IN]->(h)
      OPTIONAL MATCH (s:Student)-[:RESIDES_IN]->(h)
      WITH h, count(DISTINCT r) AS TotalRooms, coalesce(sum(r.Capacity), 0) AS TotalBedCapacity, count(DISTINCT s) AS AssignedStudents
      RETURN 
        h.HostelID AS HostelID,
        h.HostelName AS HostelName,
        h.TotalFloors AS TotalFloors,
        TotalRooms,
        TotalBedCapacity,
        AssignedStudents
      ORDER BY h.HostelID ASC
    `
  },
  'available-rooms': {
    title: '11. Available Rooms Report',
    description: 'Directory of rooms and student assignments across campus.',
    cypher: `
      MATCH (r:Room)-[:LOCATED_IN]->(h:Hostel)
      OPTIONAL MATCH (s:Student)-[:ALLOCATED_ROOM]->(r)
      WITH r, h, count(DISTINCT s) AS OccupantsCount
      RETURN 
        r.RoomNo AS RoomNo,
        r.FloorNo AS FloorNo,
        r.Type AS RoomType,
        r.Capacity AS Capacity,
        r.RoomRent AS RoomRent,
        h.HostelName AS HostelName,
        OccupantsCount
      ORDER BY h.HostelName ASC, r.FloorNo ASC, r.RoomNo ASC
    `
  },
  'student-payment-summary': {
    title: '12. Student Payment Summary Report',
    description: 'Financial rollup calculating total payment amounts aggregated per student.',
    cypher: `
      MATCH (s:Student)
      OPTIONAL MATCH (s)-[:RESIDES_IN]->(h:Hostel)
      OPTIONAL MATCH (s)-[:MADE_PAYMENT]->(p:Payment)
      WITH s, h, count(p) AS TotalTransactions, coalesce(sum(p.Amount), 0) AS TotalPaidAmount
      RETURN 
        s.StudentID AS StudentID,
        s.FirstName + ' ' + s.LastName AS StudentName,
        s.Email AS Email,
        s.RoomNo AS RoomNo,
        coalesce(h.HostelName, 'Unassigned') AS HostelName,
        TotalTransactions,
        TotalPaidAmount
      ORDER BY TotalPaidAmount DESC
    `
  },
  'inventory-procurement-summary': {
    title: '13. Inventory & Procurement Summary Report',
    description: 'Combined stock and procurement totals grouped by inventory item.',
    cypher: `
      MATCH (i:InventoryItem)
      OPTIONAL MATCH (p:Procures)-[:OF_ITEM]->(i)
      WITH i, count(p) AS ProcurementOrdersCount, coalesce(sum(p.Quantity), 0) AS TotalProcuredQuantity
      RETURN 
        i.ItemID AS ItemID,
        i.ItemName AS ItemName,
        i.Category AS Category,
        i.Unit AS Unit,
        ProcurementOrdersCount,
        TotalProcuredQuantity
      ORDER BY i.Category ASC, i.ItemName ASC
    `
  }
};

// GET list of all available reports
router.get('/', (req, res) => {
  const list = Object.keys(REPORT_DEFINITIONS).map(key => ({
    key,
    title: REPORT_DEFINITIONS[key].title,
    description: REPORT_DEFINITIONS[key].description
  }));
  res.json({ success: true, count: list.length, data: list });
});

// GET execution of specific report
router.get('/:reportKey', async (req, res) => {
  try {
    const { reportKey } = req.params;
    const report = REPORT_DEFINITIONS[reportKey];
    if (!report) {
      return res.status(404).json({ success: false, message: `Report '${reportKey}' not found` });
    }

    const startTime = process.hrtime();
    const rows = await query(report.cypher);
    const diff = process.hrtime(startTime);
    const executionTimeMs = (diff[0] * 1000 + diff[1] / 1e6).toFixed(2);

    res.json({
      success: true,
      reportKey,
      title: report.title,
      description: report.description,
      sql: report.cypher.trim(),
      cypher: report.cypher.trim(),
      executionTimeMs,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error(`Error running report '${req.params.reportKey}':`, error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
