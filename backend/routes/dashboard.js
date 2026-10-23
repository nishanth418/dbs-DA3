const express = require('express');
const router = express.Router();
const { query } = require('../database');

router.get('/stats', async (req, res) => {
  try {
    // Core KPIs from Neo4j
    const [studentsRow] = await query(`MATCH (s:Student) RETURN count(s) AS count`);
    const [hostelsRow] = await query(`MATCH (h:Hostel) RETURN count(h) AS count`);
    const [roomsRow] = await query(`MATCH (r:Room) RETURN count(r) AS count`);
    const [staffRow] = await query(`MATCH (st:Staff) RETURN count(st) AS count`);
    const [suppliersRow] = await query(`MATCH (sup:Supplier) RETURN count(sup) AS count`);
    const [inventoryRow] = await query(`MATCH (i:InventoryItem) RETURN count(i) AS count`);
    const [paymentsAmountRow] = await query(`MATCH (p:Payment) WHERE p.Status = 'Successful' RETURN coalesce(sum(p.Amount), 0) AS total`);
    const [paymentsCountRow] = await query(`MATCH (p:Payment) RETURN count(p) AS count`);

    const totalStudents = Number(studentsRow?.count || 0);
    const totalHostels = Number(hostelsRow?.count || 0);
    const totalRooms = Number(roomsRow?.count || 0);
    const totalStaff = Number(staffRow?.count || 0);
    const totalSuppliers = Number(suppliersRow?.count || 0);
    const totalInventoryItems = Number(inventoryRow?.count || 0);
    const totalPaymentsAmount = Number(paymentsAmountRow?.total || 0);
    const totalPaymentsCount = Number(paymentsCountRow?.count || 0);

    const occupiedRooms = totalStudents;
    const availableRooms = Math.max(0, totalRooms - occupiedRooms);
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    // Hostel occupancy breakdown via Graph relationships
    const hostelOccupancy = await query(`
      MATCH (h:Hostel)
      OPTIONAL MATCH (r:Room)-[:LOCATED_IN]->(h)
      OPTIONAL MATCH (s:Student)-[:RESIDES_IN]->(h)
      WITH h, count(DISTINCT r) AS total_rooms, count(DISTINCT s) AS occupied_rooms
      RETURN 
        h.HostelID AS HostelID,
        h.HostelName AS name,
        'Campus Block' AS type,
        total_rooms,
        occupied_rooms,
        CASE WHEN total_rooms > 0 THEN round((occupied_rooms * 100.0) / total_rooms, 1) ELSE 0.0 END AS occupancy_rate
      ORDER BY h.HostelID ASC
    `);

    // Low stock / inventory items
    const lowStockItems = await query(`
      MATCH (i:InventoryItem)
      OPTIONAL MATCH (p:Procures)-[:OF_ITEM]->(i)
      WITH i, coalesce(sum(p.Quantity), 0) AS quantity
      RETURN 
        i.ItemID AS item_id,
        i.ItemName AS item_name,
        i.Category AS category,
        quantity,
        100 AS min_required_quantity,
        i.Unit AS unit
      ORDER BY i.ItemID ASC
      LIMIT 5
    `);

    // Recent payments with student and hostel details
    const recentPayments = await query(`
      MATCH (s:Student)-[:MADE_PAYMENT]->(p:Payment)
      OPTIONAL MATCH (s)-[:RESIDES_IN]->(h:Hostel)
      RETURN 
        p.PaymentID AS payment_id,
        toString(p.PaymentDay) + '-' + toString(p.PaymentMonth) + '-' + toString(p.PaymentYear) AS payment_date,
        p.Amount AS total_amount,
        p.PaymentMode AS payment_method,
        p.Status AS payment_status,
        p.PaymentID AS transaction_id,
        s.FirstName + ' ' + s.LastName AS student_name,
        s.RoomNo AS room_number,
        h.HostelName AS hostel_name
      ORDER BY p.PaymentID DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        summary: {
          totalStudents,
          totalHostels,
          totalRooms,
          availableRooms,
          occupiedRooms,
          totalStaff,
          totalSuppliers,
          totalInventoryItems,
          totalPaymentsAmount,
          totalPaymentsCount,
          occupancyRate
        },
        hostelOccupancy,
        lowStockItems,
        recentPayments
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
