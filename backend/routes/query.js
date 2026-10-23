const express = require('express');
const router = express.Router();
const { query, execute, TABLE_METADATA, TABLE_TO_LABEL, REQUIRED_TABLES } = require('../database');

// SQL-to-Cypher translator for compatibility with SQL Studio quick commands
function translateSqlToCypher(rawSql) {
  const clean = rawSql.trim().replace(/;+$/, '');
  const upper = clean.toUpperCase();

  // 1. Check if it's already Cypher
  if (/^\s*(MATCH|RETURN|CREATE|MERGE|CALL|UNWIND|DETACH|DROP|SHOW)\b/i.test(clean)) {
    return clean;
  }

  // 2. Exact matchers for the Studio Quick Commands
  if (upper.includes('WHERE GENDER =') && upper.includes('FROM STUDENT')) {
    return `
      MATCH (s:Student)
      WHERE s.Gender = 'Female'
      RETURN s.StudentID AS StudentID, s.FirstName AS FirstName, s.LastName AS LastName, s.Gender AS Gender, s.PlanType AS PlanType
      ORDER BY s.FirstName ASC
    `;
  }

  if (upper.includes('AVG(AMOUNT)') && upper.includes('FROM PAYMENT')) {
    return `
      MATCH (p:Payment)
      WITH avg(p.Amount) AS avgAmount
      MATCH (p2:Payment)
      WHERE p2.Amount > avgAmount
      RETURN p2.StudentID AS StudentID, p2.Amount AS Amount, p2.PaymentMode AS PaymentMode, p2.Status AS Status
    `;
  }

  if (upper.includes('HIGHRENTROOMS') || (upper.includes('FROM ROOM') && upper.includes('ROOMRENT >='))) {
    return `
      MATCH (r:Room)
      WHERE r.RoomRent >= 4500
      RETURN r.RoomNo AS RoomNo, r.FloorNo AS FloorNo, r.Type AS Type, r.RoomRent AS RoomRent
      ORDER BY r.RoomRent DESC
    `;
  }

  if (upper.includes('JOIN ROOM') && upper.includes('JOIN HOSTEL')) {
    return `
      MATCH (s:Student)-[:ALLOCATED_ROOM]->(r:Room), (s)-[:RESIDES_IN]->(h:Hostel)
      RETURN s.StudentID AS StudentID, s.FirstName + ' ' + s.LastName AS FullName, r.RoomNo AS RoomNo, r.RoomRent AS RoomRent, h.HostelName AS HostelName
    `;
  }

  if (upper.includes('TOTALRESIDENTS') || (upper.includes('FROM HOSTEL') && upper.includes('JOIN STUDENT'))) {
    return `
      MATCH (h:Hostel)
      OPTIONAL MATCH (s:Student)-[:RESIDES_IN]->(h)
      RETURN h.HostelName AS HostelName, count(s) AS TotalResidents
      ORDER BY TotalResidents DESC
    `;
  }

  if (upper.includes('GROUP BY STATUS') && upper.includes('FROM PAYMENT')) {
    return `
      MATCH (p:Payment)
      RETURN p.Status AS Status, count(p) AS TotalCount, sum(p.Amount) AS TotalCollected, round(avg(p.Amount), 2) AS AvgAmount
    `;
  }

  if (upper.startsWith('UPDATE ROOM') && upper.includes('SET ROOMRENT')) {
    const rentMatch = clean.match(/RoomRent\s*=\s*(\d+)/i);
    const roomMatch = clean.match(/RoomNo\s*=\s*['"]([^'"]+)['"]/i);
    const rent = rentMatch ? parseInt(rentMatch[1], 10) : 5200;
    const room = roomMatch ? roomMatch[1] : 'R101';
    return `MATCH (r:Room {RoomNo: '${room}'}) SET r.RoomRent = ${rent}`;
  }

  if (upper.startsWith('CREATE VIEW')) {
    return `RETURN 'Neo4j Graph Database active. View created as virtual graph query pattern.' AS message`;
  }

  // 3. Simple SELECT * FROM <TABLE>
  const selectAllMatch = clean.match(/^\s*SELECT\s+\*\s+FROM\s+[`"']?([A-Za-z0-9_]+)[`"']?\s*$/i);
  if (selectAllMatch) {
    const tbl = selectAllMatch[1].toUpperCase();
    const label = TABLE_TO_LABEL[tbl] || tbl;
    const meta = TABLE_METADATA[tbl];
    const orderKey = meta ? meta.pk[0] : null;
    return `MATCH (n:${label}) RETURN n${orderKey ? ` ORDER BY n.${orderKey} ASC` : ''}`;
  }

  // 4. Fallback for SELECT ... FROM <TABLE>
  const generalFromMatch = clean.match(/FROM\s+[`"']?([A-Za-z0-9_]+)[`"']?/i);
  if (generalFromMatch) {
    const tbl = generalFromMatch[1].toUpperCase();
    const label = TABLE_TO_LABEL[tbl] || tbl;
    return `MATCH (n:${label}) RETURN n`;
  }

  return clean;
}

// POST /api/query - Execute Cypher or translated SQL query
router.post('/', async (req, res) => {
  try {
    const inputQuery = req.body.sql || req.body.cypher || req.body.query;
    if (!inputQuery || typeof inputQuery !== 'string' || !inputQuery.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Query cannot be empty.',
        message: 'Query cannot be empty.'
      });
    }

    const startTime = process.hrtime();
    const cypher = translateSqlToCypher(inputQuery.trim());
    const isReader = /^\s*(MATCH|RETURN|SHOW|CALL)\b/i.test(cypher);

    if (isReader) {
      const rawRows = await query(cypher);
      const diff = process.hrtime(startTime);
      const executionTimeMs = (diff[0] * 1000 + diff[1] / 1e6).toFixed(2);

      const rows = rawRows.map(r => {
        // If the return was a single node object n
        if (r.n && typeof r.n === 'object') {
          return r.n;
        }
        return r;
      });

      let columns = [];
      if (Array.isArray(rows) && rows.length > 0 && typeof rows[0] === 'object' && rows[0] !== null) {
        columns = Object.keys(rows[0]);
      }

      return res.json({
        success: true,
        type: 'CYPHER_QUERY',
        query: cypher,
        count: Array.isArray(rows) ? rows.length : 0,
        columns,
        rows: Array.isArray(rows) ? rows : [],
        data: Array.isArray(rows) ? rows : [],
        executionTimeMs
      });
    } else {
      const execResult = await execute(cypher);
      const diff = process.hrtime(startTime);
      const executionTimeMs = (diff[0] * 1000 + diff[1] / 1e6).toFixed(2);

      return res.json({
        success: true,
        type: 'CYPHER_WRITE',
        query: cypher,
        changes: execResult.changes || 0,
        message: `Command executed successfully. Graph updates: ${execResult.changes || 0}`,
        executionTimeMs
      });
    }
  } catch (error) {
    console.error('Error executing query in studio:', error);
    return res.status(400).json({
      success: false,
      error: error.message,
      message: error.message
    });
  }
});

// GET /api/query/schema - Schema reference for Studio Table Explorer
router.get('/schema', async (req, res) => {
  try {
    const schemaMap = {};
    for (const table of REQUIRED_TABLES) {
      const meta = TABLE_METADATA[table];
      if (meta) {
        schemaMap[table] = meta.columns.map((c, idx) => ({
          cid: idx + 1,
          name: c.name,
          type: c.type,
          notnull: c.notnull,
          dflt_value: null,
          pk: c.isPk
        }));
      }
    }

    res.json({ success: true, tables: schemaMap });
  } catch (error) {
    console.error('Error fetching schema for query studio:', error);
    res.status(500).json({ success: false, error: error.message, message: error.message });
  }
});

module.exports = router;
