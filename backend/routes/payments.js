const express = require('express');
const router = express.Router();
const { query, execute, syncRelationships } = require('../database');

// GET all payments with student name & payment details
router.get('/', async (req, res) => {
  try {
    const { student_id, status, search } = req.query;

    const cypher = `
      MATCH (s:Student)-[:MADE_PAYMENT]->(p:Payment)
      OPTIONAL MATCH (s)-[:RESIDES_IN]->(h:Hostel)
      OPTIONAL MATCH (p)-[:HAS_DETAIL]->(pd:PaymentDetail)
      WHERE ($studentId IS NULL OR p.StudentID = $studentId)
        AND ($status IS NULL OR p.Status = $status)
        AND ($search IS NULL OR toLower(p.PaymentID) CONTAINS toLower($search) 
              OR toLower(s.FirstName) CONTAINS toLower($search) 
              OR toLower(s.LastName) CONTAINS toLower($search))
      WITH s, p, h, count(pd) AS details_count
      RETURN 
        p.PaymentID AS payment_id,
        p.PaymentID AS PaymentID,
        p.StudentID AS student_id,
        p.StudentID AS StudentID,
        p.Amount AS total_amount,
        p.Amount AS amount,
        p.Amount AS Amount,
        p.PaymentMode AS payment_method,
        p.PaymentMode AS PaymentMode,
        p.Status AS payment_status,
        p.Status AS status,
        p.Status AS Status,
        p.PaymentDay AS PaymentDay,
        p.PaymentMonth AS PaymentMonth,
        p.PaymentYear AS PaymentYear,
        toString(p.PaymentDay) + '-' + toString(p.PaymentMonth) + '-' + toString(p.PaymentYear) AS payment_date,
        p.PaymentID AS transaction_id,
        s.FirstName + ' ' + s.LastName AS student_name,
        s.Email AS student_email,
        s.RoomNo AS room_number,
        coalesce(h.HostelName, 'Unassigned') AS hostel_name,
        details_count
      ORDER BY p.PaymentID DESC
    `;

    const rows = await query(cypher, {
      studentId: student_id && student_id.trim() ? student_id.trim() : null,
      status: status && status.trim() ? status.trim() : null,
      search: search && search.trim() ? search.trim() : null
    });

    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single payment with detail items
router.get('/:id', async (req, res) => {
  try {
    const paymentId = req.params.id;
    const cypher = `
      MATCH (s:Student)-[:MADE_PAYMENT]->(p:Payment {PaymentID: $paymentId})
      OPTIONAL MATCH (s)-[:RESIDES_IN]->(h:Hostel)
      RETURN 
        p.PaymentID AS payment_id,
        p.PaymentID AS PaymentID,
        p.StudentID AS student_id,
        p.StudentID AS StudentID,
        p.Amount AS total_amount,
        p.Amount AS Amount,
        p.PaymentMode AS payment_method,
        p.PaymentMode AS PaymentMode,
        p.Status AS payment_status,
        p.Status AS Status,
        p.PaymentDay AS PaymentDay,
        p.PaymentMonth AS PaymentMonth,
        p.PaymentYear AS PaymentYear,
        toString(p.PaymentDay) + '-' + toString(p.PaymentMonth) + '-' + toString(p.PaymentYear) AS payment_date,
        p.PaymentID AS transaction_id,
        s.FirstName + ' ' + s.LastName AS student_name,
        s.Email AS student_email,
        s.RoomNo AS room_number,
        coalesce(h.HostelName, 'Unassigned') AS hostel_name
    `;
    const rows = await query(cypher, { paymentId });

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    const payment = rows[0];
    const details = await query(`
      MATCH (p:Payment {PaymentID: $paymentId})-[:HAS_DETAIL]->(pd:PaymentDetail)
      RETURN 
        pd.PaymentID AS PaymentID,
        pd.DetailID AS DetailID,
        pd.Month AS Month,
        pd.Year AS Year,
        pd.MessCharges AS MessCharges,
        pd.OtherCharges AS OtherCharges,
        (pd.MessCharges + pd.OtherCharges) AS total
      ORDER BY pd.DetailID ASC
    `, { paymentId });

    res.json({ success: true, data: { ...payment, details } });
  } catch (error) {
    console.error('Error fetching payment by ID:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create payment
router.post('/', async (req, res) => {
  try {
    const { PaymentID, payment_id, StudentID, student_id, Amount, total_amount, amount, PaymentMode, payment_method, Status, status, payment_status, PaymentDay, PaymentMonth, PaymentYear, details } = req.body;
    const finalId = PaymentID || payment_id || ('PAY' + (1000 + Math.floor(Math.random() * 9000)));
    const finalStudentId = StudentID || student_id;
    const finalAmount = Number(Amount !== undefined ? Amount : (total_amount !== undefined ? total_amount : (amount || 10000)));
    const now = new Date();
    const day = PaymentDay || now.getDate();
    const month = PaymentMonth || (now.getMonth() + 1);
    const year = PaymentYear || now.getFullYear();

    if (!finalStudentId) {
      return res.status(400).json({ success: false, message: 'Student ID is required' });
    }

    const paymentProps = {
      PaymentID: finalId,
      StudentID: finalStudentId,
      Amount: finalAmount,
      PaymentMode: PaymentMode || payment_method || 'UPI',
      Status: Status || payment_status || status || 'Successful',
      PaymentDay: day,
      PaymentMonth: month,
      PaymentYear: year
    };

    await execute(`
      MERGE (p:Payment {PaymentID: $paymentId})
      SET p += $props
    `, { paymentId: finalId, props: paymentProps });

    await syncRelationships('Payment', paymentProps);

    if (details && Array.isArray(details) && details.length > 0) {
      for (let i = 0; i < details.length; i++) {
        const d = details[i];
        const detailId = d.DetailID || d.detail_id || ('D' + (i + 1));
        const detailProps = {
          PaymentID: finalId,
          DetailID: detailId,
          Month: d.Month || d.month || 'Current',
          Year: Number(d.Year || d.year || year),
          MessCharges: Number(d.MessCharges || d.mess_charges || 0),
          OtherCharges: Number(d.OtherCharges || d.other_charges || 0)
        };

        await execute(`
          MERGE (pd:PaymentDetail {PaymentID: $paymentId, DetailID: $detailId})
          SET pd += $props
          WITH pd
          MATCH (p:Payment {PaymentID: $paymentId})
          MERGE (p)-[:HAS_DETAIL]->(pd)
        `, {
          paymentId: finalId,
          detailId,
          props: detailProps
        });
      }
    }

    res.status(201).json({ success: true, message: 'Payment recorded successfully', paymentId: finalId });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE payment
router.delete('/:id', async (req, res) => {
  try {
    const paymentId = req.params.id;
    await execute(`
      MATCH (p:Payment {PaymentID: $paymentId})
      OPTIONAL MATCH (p)-[:HAS_DETAIL]->(pd:PaymentDetail)
      DETACH DELETE p, pd
    `, { paymentId });
    res.json({ success: true, message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
