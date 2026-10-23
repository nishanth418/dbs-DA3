const neo4j = require('neo4j-driver');
const path = require('path');
require('dotenv').config();
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const REQUIRED_TABLES = [
  'WARDEN',
  'WARDEN_PHONE',
  'HOSTEL',
  'ROOM_TYPE',
  'ROOM',
  'STUDENT',
  'STUDENT_PHONE',
  'MESS',
  'MESS_CONTACT',
  'MEAL',
  'STAFF',
  'STAFF_PHONE',
  'SUPPLIER',
  'SUPPLIER_PHONE',
  'INVENTORY_ITEM',
  'PROCURES',
  'PAYMENT',
  'PAYMENT_DETAIL'
];

const TABLE_TO_LABEL = {
  WARDEN: 'Warden',
  WARDEN_PHONE: 'WardenPhone',
  HOSTEL: 'Hostel',
  ROOM_TYPE: 'RoomType',
  ROOM: 'Room',
  STUDENT: 'Student',
  STUDENT_PHONE: 'StudentPhone',
  MESS: 'Mess',
  MESS_CONTACT: 'MessContact',
  MEAL: 'Meal',
  STAFF: 'Staff',
  STAFF_PHONE: 'StaffPhone',
  SUPPLIER: 'Supplier',
  SUPPLIER_PHONE: 'SupplierPhone',
  INVENTORY_ITEM: 'InventoryItem',
  PROCURES: 'Procures',
  PAYMENT: 'Payment',
  PAYMENT_DETAIL: 'PaymentDetail'
};

const TABLE_METADATA = {
  WARDEN: {
    label: 'Warden',
    pk: ['WardenID'],
    columns: [
      { name: 'WardenID', type: 'VARCHAR(10)', notnull: true, isPk: true },
      { name: 'WardenName', type: 'VARCHAR(100)', notnull: true, isPk: false },
      { name: 'Email', type: 'VARCHAR(100)', notnull: false, isPk: false },
      { name: 'JoiningDate', type: 'VARCHAR(20)', notnull: false, isPk: false }
    ],
    fks: []
  },
  WARDEN_PHONE: {
    label: 'WardenPhone',
    pk: ['WardenID', 'PhoneNo'],
    columns: [
      { name: 'WardenID', type: 'VARCHAR(10)', notnull: true, isPk: true },
      { name: 'PhoneNo', type: 'VARCHAR(20)', notnull: true, isPk: true }
    ],
    fks: [{ from: 'WardenID', table: 'WARDEN', to: 'WardenID' }]
  },
  HOSTEL: {
    label: 'Hostel',
    pk: ['HostelID'],
    columns: [
      { name: 'HostelID', type: 'VARCHAR(10)', notnull: true, isPk: true },
      { name: 'HostelName', type: 'VARCHAR(100)', notnull: true, isPk: false },
      { name: 'TotalFloors', type: 'INT', notnull: false, isPk: false },
      { name: 'WardenID', type: 'VARCHAR(10)', notnull: false, isPk: false }
    ],
    fks: [{ from: 'WardenID', table: 'WARDEN', to: 'WardenID' }]
  },
  ROOM_TYPE: {
    label: 'RoomType',
    pk: ['TypeID'],
    columns: [
      { name: 'TypeID', type: 'VARCHAR(10)', notnull: true, isPk: true },
      { name: 'TypeName', type: 'VARCHAR(30)', notnull: false, isPk: false },
      { name: 'AC_Type', type: 'VARCHAR(20)', notnull: false, isPk: false },
      { name: 'Capacity', type: 'INT', notnull: false, isPk: false }
    ],
    fks: []
  },
  ROOM: {
    label: 'Room',
    pk: ['RoomNo'],
    columns: [
      { name: 'RoomNo', type: 'VARCHAR(10)', notnull: true, isPk: true },
      { name: 'FloorNo', type: 'INT', notnull: false, isPk: false },
      { name: 'Type', type: 'VARCHAR(30)', notnull: false, isPk: false },
      { name: 'Capacity', type: 'INT', notnull: false, isPk: false },
      { name: 'RoomRent', type: 'DECIMAL(10,2)', notnull: false, isPk: false },
      { name: 'HostelID', type: 'VARCHAR(10)', notnull: false, isPk: false }
    ],
    fks: [{ from: 'HostelID', table: 'HOSTEL', to: 'HostelID' }]
  },
  MESS: {
    label: 'Mess',
    pk: ['MessID'],
    columns: [
      { name: 'MessID', type: 'VARCHAR(10)', notnull: true, isPk: true },
      { name: 'MessName', type: 'VARCHAR(100)', notnull: true, isPk: false },
      { name: 'MessType', type: 'VARCHAR(30)', notnull: false, isPk: false },
      { name: 'Location', type: 'VARCHAR(100)', notnull: false, isPk: false }
    ],
    fks: []
  },
  STUDENT: {
    label: 'Student',
    pk: ['StudentID'],
    columns: [
      { name: 'StudentID', type: 'VARCHAR(10)', notnull: true, isPk: true },
      { name: 'FirstName', type: 'VARCHAR(50)', notnull: true, isPk: false },
      { name: 'LastName', type: 'VARCHAR(50)', notnull: true, isPk: false },
      { name: 'Gender', type: 'VARCHAR(10)', notnull: false, isPk: false },
      { name: 'DOB', type: 'VARCHAR(20)', notnull: false, isPk: false },
      { name: 'Email', type: 'VARCHAR(100)', notnull: false, isPk: false },
      { name: 'BloodGroup', type: 'VARCHAR(5)', notnull: false, isPk: false },
      { name: 'AllergyInfo', type: 'VARCHAR(100)', notnull: false, isPk: false },
      { name: 'PlanType', type: 'VARCHAR(50)', notnull: false, isPk: false },
      { name: 'RoomNo', type: 'VARCHAR(10)', notnull: false, isPk: false },
      { name: 'HostelID', type: 'VARCHAR(10)', notnull: false, isPk: false },
      { name: 'MessID', type: 'VARCHAR(10)', notnull: false, isPk: false },
      { name: 'MentorStudentID', type: 'VARCHAR(10)', notnull: false, isPk: false }
    ],
    fks: [
      { from: 'RoomNo', table: 'ROOM', to: 'RoomNo' },
      { from: 'HostelID', table: 'HOSTEL', to: 'HostelID' },
      { from: 'MessID', table: 'MESS', to: 'MessID' },
      { from: 'MentorStudentID', table: 'STUDENT', to: 'StudentID' }
    ]
  },
  STUDENT_PHONE: {
    label: 'StudentPhone',
    pk: ['StudentID', 'PhoneNo'],
    columns: [
      { name: 'StudentID', type: 'VARCHAR(10)', notnull: true, isPk: true },
      { name: 'PhoneNo', type: 'VARCHAR(20)', notnull: true, isPk: true }
    ],
    fks: [{ from: 'StudentID', table: 'STUDENT', to: 'StudentID' }]
  },
  MESS_CONTACT: {
    label: 'MessContact',
    pk: ['MessID', 'ContactNo'],
    columns: [
      { name: 'MessID', type: 'VARCHAR(10)', notnull: true, isPk: true },
      { name: 'ContactNo', type: 'VARCHAR(20)', notnull: true, isPk: true }
    ],
    fks: [{ from: 'MessID', table: 'MESS', to: 'MessID' }]
  },
  MEAL: {
    label: 'Meal',
    pk: ['MealID'],
    columns: [
      { name: 'MealID', type: 'VARCHAR(10)', notnull: true, isPk: true },
      { name: 'MealName', type: 'VARCHAR(100)', notnull: true, isPk: false },
      { name: 'Description', type: 'VARCHAR(200)', notnull: false, isPk: false },
      { name: 'Cost', type: 'DECIMAL(10,2)', notnull: false, isPk: false },
      { name: 'MessID', type: 'VARCHAR(10)', notnull: false, isPk: false }
    ],
    fks: [{ from: 'MessID', table: 'MESS', to: 'MessID' }]
  },
  STAFF: {
    label: 'Staff',
    pk: ['StaffID'],
    columns: [
      { name: 'StaffID', type: 'VARCHAR(10)', notnull: true, isPk: true },
      { name: 'StaffName', type: 'VARCHAR(100)', notnull: true, isPk: false },
      { name: 'JoinDate', type: 'VARCHAR(20)', notnull: false, isPk: false },
      { name: 'Salary', type: 'DECIMAL(10,2)', notnull: false, isPk: false },
      { name: 'Role', type: 'VARCHAR(50)', notnull: false, isPk: false },
      { name: 'MessID', type: 'VARCHAR(10)', notnull: false, isPk: false }
    ],
    fks: [{ from: 'MessID', table: 'MESS', to: 'MessID' }]
  },
  STAFF_PHONE: {
    label: 'StaffPhone',
    pk: ['StaffID', 'PhoneNo'],
    columns: [
      { name: 'StaffID', type: 'VARCHAR(10)', notnull: true, isPk: true },
      { name: 'PhoneNo', type: 'VARCHAR(20)', notnull: true, isPk: true }
    ],
    fks: [{ from: 'StaffID', table: 'STAFF', to: 'StaffID' }]
  },
  SUPPLIER: {
    label: 'Supplier',
    pk: ['SupplierID'],
    columns: [
      { name: 'SupplierID', type: 'VARCHAR(10)', notnull: true, isPk: true },
      { name: 'SupplierName', type: 'VARCHAR(100)', notnull: true, isPk: false }
    ],
    fks: []
  },
  SUPPLIER_PHONE: {
    label: 'SupplierPhone',
    pk: ['SupplierID', 'PhoneNo'],
    columns: [
      { name: 'SupplierID', type: 'VARCHAR(10)', notnull: true, isPk: true },
      { name: 'PhoneNo', type: 'VARCHAR(20)', notnull: true, isPk: true }
    ],
    fks: [{ from: 'SupplierID', table: 'SUPPLIER', to: 'SupplierID' }]
  },
  INVENTORY_ITEM: {
    label: 'InventoryItem',
    pk: ['ItemID'],
    columns: [
      { name: 'ItemID', type: 'VARCHAR(10)', notnull: true, isPk: true },
      { name: 'ItemName', type: 'VARCHAR(100)', notnull: true, isPk: false },
      { name: 'Category', type: 'VARCHAR(50)', notnull: false, isPk: false },
      { name: 'Unit', type: 'VARCHAR(20)', notnull: false, isPk: false }
    ],
    fks: []
  },
  PROCURES: {
    label: 'Procures',
    pk: ['MessID', 'SupplierID', 'ItemID'],
    columns: [
      { name: 'MessID', type: 'VARCHAR(10)', notnull: true, isPk: true },
      { name: 'SupplierID', type: 'VARCHAR(10)', notnull: true, isPk: true },
      { name: 'ItemID', type: 'VARCHAR(10)', notnull: true, isPk: true },
      { name: 'Quantity', type: 'DECIMAL(10,2)', notnull: false, isPk: false }
    ],
    fks: [
      { from: 'MessID', table: 'MESS', to: 'MessID' },
      { from: 'SupplierID', table: 'SUPPLIER', to: 'SupplierID' },
      { from: 'ItemID', table: 'INVENTORY_ITEM', to: 'ItemID' }
    ]
  },
  PAYMENT: {
    label: 'Payment',
    pk: ['PaymentID'],
    columns: [
      { name: 'PaymentID', type: 'VARCHAR(10)', notnull: true, isPk: true },
      { name: 'StudentID', type: 'VARCHAR(10)', notnull: true, isPk: false },
      { name: 'Amount', type: 'DECIMAL(10,2)', notnull: false, isPk: false },
      { name: 'PaymentMode', type: 'VARCHAR(30)', notnull: false, isPk: false },
      { name: 'Status', type: 'VARCHAR(50)', notnull: false, isPk: false },
      { name: 'PaymentDay', type: 'INT', notnull: false, isPk: false },
      { name: 'PaymentMonth', type: 'INT', notnull: false, isPk: false },
      { name: 'PaymentYear', type: 'INT', notnull: false, isPk: false }
    ],
    fks: [{ from: 'StudentID', table: 'STUDENT', to: 'StudentID' }]
  },
  PAYMENT_DETAIL: {
    label: 'PaymentDetail',
    pk: ['PaymentID', 'DetailID'],
    columns: [
      { name: 'PaymentID', type: 'VARCHAR(10)', notnull: true, isPk: true },
      { name: 'DetailID', type: 'VARCHAR(10)', notnull: true, isPk: true },
      { name: 'Month', type: 'VARCHAR(30)', notnull: false, isPk: false },
      { name: 'Year', type: 'INT', notnull: false, isPk: false },
      { name: 'MessCharges', type: 'DECIMAL(10,2)', notnull: false, isPk: false },
      { name: 'OtherCharges', type: 'DECIMAL(10,2)', notnull: false, isPk: false }
    ],
    fks: [{ from: 'PaymentID', table: 'PAYMENT', to: 'PaymentID' }]
  }
};

let driverInstance = null;

function getDriver() {
  if (!driverInstance) {
    const uri = process.env.NEO4J_URI || 'neo4j+s://cd34fb3a.databases.neo4j.io';
    const user = process.env.NEO4J_USERNAME || 'cd34fb3a';
    const password = process.env.NEO4J_PASSWORD || '';

    if (!password) {
      console.warn('WARNING: NEO4J_PASSWORD is not set. Database connections will fail.');
    }

    driverInstance = neo4j.driver(uri, neo4j.auth.basic(user, password), {
      maxConnectionPoolSize: 50,
      connectionAcquisitionTimeout: 30000,
      disableLosslessIntegers: false
    });
  }
  return driverInstance;
}

function normalizeNeo4jValue(value) {
  if (value === null || value === undefined) return value;
  if (neo4j.isInt(value)) {
    return value.inSafeRange() ? value.toNumber() : value.toString();
  }
  if (Array.isArray(value)) {
    return value.map(normalizeNeo4jValue);
  }
  if (typeof value === 'object') {
    // If it's a Neo4j Node
    if (value.properties && typeof value.properties === 'object') {
      return normalizeNeo4jValue(value.properties);
    }
    // If it's a Neo4j Relationship
    if (value.type && value.properties) {
      return normalizeNeo4jValue(value.properties);
    }
    const normalized = {};
    for (const [k, v] of Object.entries(value)) {
      normalized[k] = normalizeNeo4jValue(v);
    }
    return normalized;
  }
  return value;
}

function recordToObject(record) {
  const obj = {};
  record.keys.forEach((key) => {
    obj[key] = normalizeNeo4jValue(record.get(key));
  });
  return obj;
}

/**
 * Universal Cypher query runner with session management
 */
async function runCypher(cypher, params = {}) {
  const driver = getDriver();
  const session = driver.session({ defaultAccessMode: neo4j.session.WRITE });
  try {
    const result = await session.run(cypher, params);
    return result.records.map(recordToObject);
  } finally {
    await session.close();
  }
}

/**
 * Execute Cypher query and return summary statistics
 */
async function execute(cypher, params = {}) {
  const driver = getDriver();
  const session = driver.session({ defaultAccessMode: neo4j.session.WRITE });
  try {
    const result = await session.run(cypher, params);
    const updates = result.summary.counters.updates();
    const changes =
      updates.nodesCreated +
      updates.nodesDeleted +
      updates.relationshipsCreated +
      updates.relationshipsDeleted +
      updates.propertiesSet;
    return {
      affectedRows: changes,
      changes,
      summary: updates
    };
  } finally {
    await session.close();
  }
}

/**
 * Sync relationships for a node after creation or update
 */
async function syncRelationships(label, properties) {
  if (!properties || typeof properties !== 'object') return;
  const driver = getDriver();
  const session = driver.session();
  try {
    if (label === 'Hostel' && properties.HostelID && properties.WardenID) {
      await session.run(`
        MATCH (h:Hostel {HostelID: $hostelId})
        OPTIONAL MATCH (h)-[r:MANAGED_BY]->()
        DELETE r
        WITH h
        MATCH (w:Warden {WardenID: $wardenId})
        MERGE (h)-[:MANAGED_BY]->(w)
      `, { hostelId: properties.HostelID, wardenId: properties.WardenID });
    }

    if (label === 'Room' && properties.RoomNo) {
      if (properties.HostelID) {
        await session.run(`
          MATCH (r:Room {RoomNo: $roomNo})
          OPTIONAL MATCH (r)-[rel:LOCATED_IN]->()
          DELETE rel
          WITH r
          MATCH (h:Hostel {HostelID: $hostelId})
          MERGE (r)-[:LOCATED_IN]->(h)
        `, { roomNo: properties.RoomNo, hostelId: properties.HostelID });
      }
      if (properties.Type) {
        await session.run(`
          MATCH (r:Room {RoomNo: $roomNo})
          OPTIONAL MATCH (r)-[rel:HAS_TYPE]->()
          DELETE rel
          WITH r
          MATCH (rt:RoomType)
          WHERE rt.TypeName = $type OR rt.TypeID = $type OR $type CONTAINS rt.TypeName
          MERGE (r)-[:HAS_TYPE]->(rt)
        `, { roomNo: properties.RoomNo, type: properties.Type });
      }
    }

    if (label === 'Student' && properties.StudentID) {
      const p = properties;
      if (p.RoomNo) {
        await session.run(`
          MATCH (s:Student {StudentID: $studentId})
          OPTIONAL MATCH (s)-[rel:ALLOCATED_ROOM]->()
          DELETE rel
          WITH s
          MATCH (r:Room {RoomNo: $roomNo})
          MERGE (s)-[:ALLOCATED_ROOM]->(r)
        `, { studentId: p.StudentID, roomNo: p.RoomNo });
      }
      if (p.HostelID) {
        await session.run(`
          MATCH (s:Student {StudentID: $studentId})
          OPTIONAL MATCH (s)-[rel:RESIDES_IN]->()
          DELETE rel
          WITH s
          MATCH (h:Hostel {HostelID: $hostelId})
          MERGE (s)-[:RESIDES_IN]->(h)
        `, { studentId: p.StudentID, hostelId: p.HostelID });
      }
      if (p.MessID) {
        await session.run(`
          MATCH (s:Student {StudentID: $studentId})
          OPTIONAL MATCH (s)-[rel:SUBSCRIBED_TO]->()
          DELETE rel
          WITH s
          MATCH (m:Mess {MessID: $messId})
          MERGE (s)-[:SUBSCRIBED_TO]->(m)
        `, { studentId: p.StudentID, messId: p.MessID });
      }
      if (p.MentorStudentID) {
        await session.run(`
          MATCH (s:Student {StudentID: $studentId})
          OPTIONAL MATCH (s)-[rel:MENTORED_BY]->()
          DELETE rel
          WITH s
          MATCH (mentor:Student {StudentID: $mentorId})
          MERGE (s)-[:MENTORED_BY]->(mentor)
        `, { studentId: p.StudentID, mentorId: p.MentorStudentID });
      }
    }

    if (label === 'WardenPhone' && properties.WardenID && properties.PhoneNo) {
      await session.run(`
        MATCH (w:Warden {WardenID: $wardenId}), (wp:WardenPhone {WardenID: $wardenId, PhoneNo: $phoneNo})
        MERGE (w)-[:HAS_PHONE]->(wp)
      `, { wardenId: properties.WardenID, phoneNo: properties.PhoneNo });
    }

    if (label === 'StudentPhone' && properties.StudentID && properties.PhoneNo) {
      await session.run(`
        MATCH (s:Student {StudentID: $studentId}), (sp:StudentPhone {StudentID: $studentId, PhoneNo: $phoneNo})
        MERGE (s)-[:HAS_PHONE]->(sp)
      `, { studentId: properties.StudentID, phoneNo: properties.PhoneNo });
    }

    if (label === 'StaffPhone' && properties.StaffID && properties.PhoneNo) {
      await session.run(`
        MATCH (st:Staff {StaffID: $staffId}), (stp:StaffPhone {StaffID: $staffId, PhoneNo: $phoneNo})
        MERGE (st)-[:HAS_PHONE]->(stp)
      `, { staffId: properties.StaffID, phoneNo: properties.PhoneNo });
    }

    if (label === 'SupplierPhone' && properties.SupplierID && properties.PhoneNo) {
      await session.run(`
        MATCH (sup:Supplier {SupplierID: $supplierId}), (supp:SupplierPhone {SupplierID: $supplierId, PhoneNo: $phoneNo})
        MERGE (sup)-[:HAS_PHONE]->(supp)
      `, { supplierId: properties.SupplierID, phoneNo: properties.PhoneNo });
    }

    if (label === 'MessContact' && properties.MessID && properties.ContactNo) {
      await session.run(`
        MATCH (m:Mess {MessID: $messId}), (mc:MessContact {MessID: $messId, ContactNo: $contactNo})
        MERGE (m)-[:HAS_CONTACT]->(mc)
      `, { messId: properties.MessID, contactNo: properties.ContactNo });
    }

    if (label === 'Meal' && properties.MealID && properties.MessID) {
      await session.run(`
        MATCH (ml:Meal {MealID: $mealId})
        OPTIONAL MATCH (ml)-[rel:SERVED_AT]->()
        DELETE rel
        WITH ml
        MATCH (m:Mess {MessID: $messId})
        MERGE (ml)-[:SERVED_AT]->(m)
      `, { mealId: properties.MealID, messId: properties.MessID });
    }

    if (label === 'Staff' && properties.StaffID && properties.MessID) {
      await session.run(`
        MATCH (st:Staff {StaffID: $staffId})
        OPTIONAL MATCH (st)-[rel:ASSIGNED_TO]->()
        DELETE rel
        WITH st
        MATCH (m:Mess {MessID: $messId})
        MERGE (st)-[:ASSIGNED_TO]->(m)
      `, { staffId: properties.StaffID, messId: properties.MessID });
    }

    if (label === 'Payment' && properties.PaymentID && properties.StudentID) {
      await session.run(`
        MATCH (s:Student {StudentID: $studentId}), (p:Payment {PaymentID: $paymentId})
        MERGE (s)-[:MADE_PAYMENT]->(p)
      `, { studentId: properties.StudentID, paymentId: properties.PaymentID });
    }

    if (label === 'PaymentDetail' && properties.PaymentID && properties.DetailID) {
      await session.run(`
        MATCH (p:Payment {PaymentID: $paymentId}), (pd:PaymentDetail {PaymentID: $paymentId, DetailID: $detailId})
        MERGE (p)-[:HAS_DETAIL]->(pd)
      `, { paymentId: properties.PaymentID, detailId: properties.DetailID });
    }

    if (label === 'Procures' && properties.MessID && properties.SupplierID && properties.ItemID) {
      await session.run(`
        MATCH (m:Mess {MessID: $messId}), (sup:Supplier {SupplierID: $supplierId}), (i:InventoryItem {ItemID: $itemId}), (p:Procures {MessID: $messId, SupplierID: $supplierId, ItemID: $itemId})
        MERGE (m)-[:PROCURES]->(p)
        MERGE (p)-[:FROM_SUPPLIER]->(sup)
        MERGE (p)-[:OF_ITEM]->(i)
        MERGE (sup)-[:SUPPLIES]->(i)
      `, { messId: properties.MessID, supplierId: properties.SupplierID, itemId: properties.ItemID });
    }
  } catch (err) {
    console.warn(`[Neo4j syncRelationships] Failed to sync relationships for ${label}:`, err.message);
  } finally {
    await session.close();
  }
}

/**
 * Retrieve list of application table names (all 18 tables)
 */
async function getApplicationTables() {
  return [...REQUIRED_TABLES];
}

/**
 * Seed all authentic data using idempotent MERGE queries
 */
async function initDatabase(force = false) {
  const driver = getDriver();
  const session = driver.session();
  try {
    console.log('[Neo4j] Initializing database schema constraints and seed records...');

    // 1. Constraints for uniqueness
    const constraints = [
      'CREATE CONSTRAINT IF NOT EXISTS FOR (w:Warden) REQUIRE w.WardenID IS UNIQUE',
      'CREATE CONSTRAINT IF NOT EXISTS FOR (h:Hostel) REQUIRE h.HostelID IS UNIQUE',
      'CREATE CONSTRAINT IF NOT EXISTS FOR (rt:RoomType) REQUIRE rt.TypeID IS UNIQUE',
      'CREATE CONSTRAINT IF NOT EXISTS FOR (r:Room) REQUIRE r.RoomNo IS UNIQUE',
      'CREATE CONSTRAINT IF NOT EXISTS FOR (m:Mess) REQUIRE m.MessID IS UNIQUE',
      'CREATE CONSTRAINT IF NOT EXISTS FOR (s:Student) REQUIRE s.StudentID IS UNIQUE',
      'CREATE CONSTRAINT IF NOT EXISTS FOR (ml:Meal) REQUIRE ml.MealID IS UNIQUE',
      'CREATE CONSTRAINT IF NOT EXISTS FOR (st:Staff) REQUIRE st.StaffID IS UNIQUE',
      'CREATE CONSTRAINT IF NOT EXISTS FOR (sup:Supplier) REQUIRE sup.SupplierID IS UNIQUE',
      'CREATE CONSTRAINT IF NOT EXISTS FOR (i:InventoryItem) REQUIRE i.ItemID IS UNIQUE',
      'CREATE CONSTRAINT IF NOT EXISTS FOR (p:Payment) REQUIRE p.PaymentID IS UNIQUE'
    ];

    for (const c of constraints) {
      try {
        await session.run(c);
      } catch (err) {
        console.warn('Constraint notice:', err.message);
      }
    }

    // 2. Check if already seeded
    const countRes = await session.run('MATCH (s:Student) RETURN count(s) as count');
    const studentCount = countRes.records[0].get('count').toNumber();
    if (studentCount >= 5 && !force) {
      console.log(`[Neo4j] Database already initialized with ${studentCount} students and associated entities.`);
      return { initialized: false, tables: REQUIRED_TABLES };
    }

    // 3. Seed WARDEN
    await session.run(`
      UNWIND [
        {WardenID: 'W101', WardenName: 'Dr. Rajesh Kumar', Email: 'rajesh.k@univ.edu', JoiningDate: '15-JUN-18'},
        {WardenID: 'W102', WardenName: 'Prof. Anita Sharma', Email: 'anita@univ.edu', JoiningDate: '01-AUG-19'},
        {WardenID: 'W103', WardenName: 'Dr. Suresh Menon', Email: 'suresh.m@univ.edu', JoiningDate: '10-JAN-20'},
        {WardenID: 'W104', WardenName: 'Prof. Priya Nair', Email: 'priya.n@univ.edu', JoiningDate: '20-JUL-21'},
        {WardenID: 'W105', WardenName: 'Dr. Amit Verma', Email: 'amit.v@univ.edu', JoiningDate: '05-MAR-22'}
      ] AS row
      MERGE (w:Warden {WardenID: row.WardenID})
      SET w += row
    `);

    // 4. Seed WARDEN_PHONE
    await session.run(`
      UNWIND [
        {WardenID: 'W101', PhoneNo: '9876500001'},
        {WardenID: 'W101', PhoneNo: '9876500002'},
        {WardenID: 'W102', PhoneNo: '9876500003'},
        {WardenID: 'W103', PhoneNo: '9876500004'},
        {WardenID: 'W104', PhoneNo: '9876500005'}
      ] AS row
      MERGE (wp:WardenPhone {WardenID: row.WardenID, PhoneNo: row.PhoneNo})
      SET wp += row
      WITH wp, row
      MATCH (w:Warden {WardenID: row.WardenID})
      MERGE (w)-[:HAS_PHONE]->(wp)
    `);

    // 5. Seed HOSTEL
    await session.run(`
      UNWIND [
        {HostelID: 'H1', HostelName: 'Cauvery Boys Hostel', TotalFloors: 4, WardenID: 'W101'},
        {HostelID: 'H2', HostelName: 'Ganga Girls Hostel', TotalFloors: 4, WardenID: 'W102'},
        {HostelID: 'H3', HostelName: 'Yamuna Boys Hostel', TotalFloors: 3, WardenID: 'W103'},
        {HostelID: 'H4', HostelName: 'Krishna Girls Hostel', TotalFloors: 3, WardenID: 'W104'},
        {HostelID: 'H5', HostelName: 'Narmada PG Hostel', TotalFloors: 2, WardenID: 'W105'}
      ] AS row
      MERGE (h:Hostel {HostelID: row.HostelID})
      SET h += row
      WITH h, row
      MATCH (w:Warden {WardenID: row.WardenID})
      MERGE (h)-[:MANAGED_BY]->(w)
    `);

    // 6. Seed ROOM_TYPE
    await session.run(`
      UNWIND [
        {TypeID: 'RT1', TypeName: 'Single', AC_Type: 'AC', Capacity: 1},
        {TypeID: 'RT2', TypeName: 'Double', AC_Type: 'Non-AC', Capacity: 2},
        {TypeID: 'RT3', TypeName: 'Triple', AC_Type: 'Non-AC', Capacity: 3}
      ] AS row
      MERGE (rt:RoomType {TypeID: row.TypeID})
      SET rt += row
    `);

    // 7. Seed ROOM
    await session.run(`
      UNWIND [
        {RoomNo: 'R101', FloorNo: 1, Type: 'Single AC', Capacity: 1, RoomRent: 5000, HostelID: 'H1'},
        {RoomNo: 'R102', FloorNo: 1, Type: 'Double Non-AC', Capacity: 2, RoomRent: 4000, HostelID: 'H1'},
        {RoomNo: 'R201', FloorNo: 2, Type: 'Triple Non-AC', Capacity: 3, RoomRent: 3500, HostelID: 'H2'},
        {RoomNo: 'R202', FloorNo: 2, Type: 'Double Non-AC', Capacity: 2, RoomRent: 4000, HostelID: 'H3'},
        {RoomNo: 'R301', FloorNo: 3, Type: 'Single AC', Capacity: 1, RoomRent: 5000, HostelID: 'H4'}
      ] AS row
      MERGE (r:Room {RoomNo: row.RoomNo})
      SET r += row
      WITH r, row
      MATCH (h:Hostel {HostelID: row.HostelID})
      MERGE (r)-[:LOCATED_IN]->(h)
    `);

    // 8. Seed MESS
    await session.run(`
      UNWIND [
        {MessID: 'M1', MessName: 'North Dining Hall', MessType: 'Pure Veg', Location: 'North Campus Block A'},
        {MessID: 'M2', MessName: 'South Dining Hall', MessType: 'Non-Veg Special', Location: 'South Campus Block B'},
        {MessID: 'M3', MessName: 'Central Mess', MessType: 'Mixed', Location: 'Central Plaza Block C'},
        {MessID: 'M4', MessName: 'Executive Dining', MessType: 'Continental', Location: 'Guest House Block D'},
        {MessID: 'M5', MessName: 'Fast Food and Snacks', MessType: 'Quick Bites', Location: 'Student Activity Center'}
      ] AS row
      MERGE (m:Mess {MessID: row.MessID})
      SET m += row
    `);

    // 9. Seed MESS_CONTACT
    await session.run(`
      UNWIND [
        {MessID: 'M1', ContactNo: '044-220011'},
        {MessID: 'M1', ContactNo: '044-220012'},
        {MessID: 'M2', ContactNo: '044-220021'},
        {MessID: 'M3', ContactNo: '044-220031'},
        {MessID: 'M4', ContactNo: '044-220041'}
      ] AS row
      MERGE (mc:MessContact {MessID: row.MessID, ContactNo: row.ContactNo})
      SET mc += row
      WITH mc, row
      MATCH (m:Mess {MessID: row.MessID})
      MERGE (m)-[:HAS_CONTACT]->(mc)
    `);

    // 10. Seed STUDENT (roots first, then with mentors)
    await session.run(`
      UNWIND [
        {StudentID: 'S1001', FirstName: 'Rahul', LastName: 'Sharma', Gender: 'Male', DOB: '12-04-2003', Email: 'rahul.s@univ.edu', BloodGroup: 'B+', AllergyInfo: 'None', PlanType: 'Premium', RoomNo: 'R101', HostelID: 'H1', MessID: 'M1', MentorStudentID: null},
        {StudentID: 'S1002', FirstName: 'Sneha', LastName: 'Patel', Gender: 'Female', DOB: '25-08-2004', Email: 'sneha.p@univ.edu', BloodGroup: 'O+', AllergyInfo: 'None', PlanType: 'Standard', RoomNo: 'R201', HostelID: 'H2', MessID: 'M2', MentorStudentID: null},
        {StudentID: 'S1003', FirstName: 'Rohan', LastName: 'Verma', Gender: 'Male', DOB: '15-01-2005', Email: 'rohan.v@univ.edu', BloodGroup: 'A+', AllergyInfo: 'None', PlanType: 'Standard', RoomNo: 'R102', HostelID: 'H1', MessID: 'M1', MentorStudentID: 'S1001'},
        {StudentID: 'S1004', FirstName: 'Ananya', LastName: 'Iyer', Gender: 'Female', DOB: '30-09-2005', Email: 'ananya.i@univ.edu', BloodGroup: 'AB+', AllergyInfo: 'Lactose', PlanType: 'Standard', RoomNo: 'R201', HostelID: 'H2', MessID: 'M2', MentorStudentID: 'S1002'},
        {StudentID: 'S1005', FirstName: 'Vikram', LastName: 'Singh', Gender: 'Male', DOB: '05-11-2004', Email: 'vikram.s@univ.edu', BloodGroup: 'B-', AllergyInfo: 'Dust', PlanType: 'Premium', RoomNo: 'R202', HostelID: 'H3', MessID: 'M3', MentorStudentID: 'S1001'}
      ] AS row
      MERGE (s:Student {StudentID: row.StudentID})
      SET s += row
      WITH s, row
      MATCH (h:Hostel {HostelID: row.HostelID})
      MERGE (s)-[:RESIDES_IN]->(h)
      WITH s, row
      MATCH (r:Room {RoomNo: row.RoomNo})
      MERGE (s)-[:ALLOCATED_ROOM]->(r)
      WITH s, row
      MATCH (m:Mess {MessID: row.MessID})
      MERGE (s)-[:SUBSCRIBED_TO]->(m)
    `);

    // Wire student mentors
    await session.run(`
      MATCH (s:Student), (mentor:Student)
      WHERE s.MentorStudentID IS NOT NULL AND s.MentorStudentID = mentor.StudentID
      MERGE (s)-[:MENTORED_BY]->(mentor)
    `);

    // 11. Seed STUDENT_PHONE
    await session.run(`
      UNWIND [
        {StudentID: 'S1001', PhoneNo: '9876543210'},
        {StudentID: 'S1001', PhoneNo: '9876543211'},
        {StudentID: 'S1002', PhoneNo: '9876543212'},
        {StudentID: 'S1003', PhoneNo: '9876543213'},
        {StudentID: 'S1004', PhoneNo: '9876543214'},
        {StudentID: 'S1005', PhoneNo: '9876543215'}
      ] AS row
      MERGE (sp:StudentPhone {StudentID: row.StudentID, PhoneNo: row.PhoneNo})
      SET sp += row
      WITH sp, row
      MATCH (s:Student {StudentID: row.StudentID})
      MERGE (s)-[:HAS_PHONE]->(sp)
    `);

    // 12. Seed MEAL
    await session.run(`
      UNWIND [
        {MealID: 'ML1', MealName: 'North Indian Thali', Description: 'Roti, Dhal Makhni, Paneer, Rice', Cost: 120, MessID: 'M1'},
        {MealID: 'ML2', MealName: 'South Indian Meals', Description: 'Sambhar, Rasam, Curd Rice, Pori, Payasam', Cost: 90, MessID: 'M1'},
        {MealID: 'ML3', MealName: 'Chicken Biryani', Description: 'Chicken Dum Biryani, Raita', Cost: 180, MessID: 'M2'},
        {MealID: 'ML4', MealName: 'Continental Breakfast', Description: 'Toast, Omlette, Juice, Coffee', Cost: 150, MessID: 'M4'},
        {MealID: 'ML5', MealName: 'Mini Executive Thali', Description: 'Chapati, Mixed Veg Curry, Pulao', Cost: 110, MessID: 'M3'}
      ] AS row
      MERGE (ml:Meal {MealID: row.MealID})
      SET ml += row
      WITH ml, row
      MATCH (m:Mess {MessID: row.MessID})
      MERGE (ml)-[:SERVED_AT]->(m)
    `);

    // 13. Seed STAFF
    await session.run(`
      UNWIND [
        {StaffID: 'ST1', StaffName: 'Ramesh Chandra', JoinDate: '01-FEB-19', Salary: 35000, Role: 'Head Chef', MessID: 'M1'},
        {StaffID: 'ST2', StaffName: 'Murugan P.', JoinDate: '15-MAY-20', Salary: 28000, Role: 'Assistant Cook', MessID: 'M1'},
        {StaffID: 'ST3', StaffName: "Joseph D'souza", JoinDate: '10-NOV-18', Salary: 38000, Role: 'Master Chef', MessID: 'M2'},
        {StaffID: 'ST4', StaffName: 'Sunita Devi', JoinDate: '01-AUG-21', Salary: 18000, Role: 'Cleaner', MessID: 'M2'},
        {StaffID: 'ST5', StaffName: 'Govind Ram', JoinDate: '20-JAN-22', Salary: 22000, Role: 'Store Keeper', MessID: 'M3'}
      ] AS row
      MERGE (st:Staff {StaffID: row.StaffID})
      SET st += row
      WITH st, row
      MATCH (m:Mess {MessID: row.MessID})
      MERGE (st)-[:ASSIGNED_TO]->(m)
    `);

    // 14. Seed STAFF_PHONE
    await session.run(`
      UNWIND [
        {StaffID: 'ST1', PhoneNo: '9444100001'},
        {StaffID: 'ST2', PhoneNo: '9444100002'},
        {StaffID: 'ST3', PhoneNo: '9444100003'},
        {StaffID: 'ST3', PhoneNo: '9444100004'},
        {StaffID: 'ST4', PhoneNo: '9444100005'}
      ] AS row
      MERGE (stp:StaffPhone {StaffID: row.StaffID, PhoneNo: row.PhoneNo})
      SET stp += row
      WITH stp, row
      MATCH (st:Staff {StaffID: row.StaffID})
      MERGE (st)-[:HAS_PHONE]->(stp)
    `);

    // 15. Seed SUPPLIER
    await session.run(`
      UNWIND [
        {SupplierID: 'SUP1', SupplierName: 'Fresh Farm Provisions'},
        {SupplierID: 'SUP2', SupplierName: 'Metro Dairy Products'},
        {SupplierID: 'SUP3', SupplierName: 'Coastal Poultry & Meats'},
        {SupplierID: 'SUP4', SupplierName: 'National Grain Traders'},
        {SupplierID: 'SUP5', SupplierName: 'Green Valley Vegetables'}
      ] AS row
      MERGE (sup:Supplier {SupplierID: row.SupplierID})
      SET sup += row
    `);

    // 16. Seed SUPPLIER_PHONE
    await session.run(`
      UNWIND [
        {SupplierID: 'SUP1', PhoneNo: '9884011111'},
        {SupplierID: 'SUP2', PhoneNo: '9884022222'},
        {SupplierID: 'SUP3', PhoneNo: '9884033333'},
        {SupplierID: 'SUP3', PhoneNo: '9884033334'},
        {SupplierID: 'SUP4', PhoneNo: '9884044444'}
      ] AS row
      MERGE (supp:SupplierPhone {SupplierID: row.SupplierID, PhoneNo: row.PhoneNo})
      SET supp += row
      WITH supp, row
      MATCH (sup:Supplier {SupplierID: row.SupplierID})
      MERGE (sup)-[:HAS_PHONE]->(supp)
    `);

    // 17. Seed INVENTORY_ITEM
    await session.run(`
      UNWIND [
        {ItemID: 'IT101', ItemName: 'Basmati Rice', Category: 'Grains', Unit: 'Kg'},
        {ItemID: 'IT102', ItemName: 'Toned Milk', Category: 'Dairy', Unit: 'Litre'},
        {ItemID: 'IT103', ItemName: 'Refined Sunflower Oil', Category: 'Cooking Oil', Unit: 'Litre'},
        {ItemID: 'IT104', ItemName: 'Fresh Broiler Chicken', Category: 'Meat', Unit: 'Kg'},
        {ItemID: 'IT105', ItemName: 'Potato', Category: 'Vegetables', Unit: 'Kg'}
      ] AS row
      MERGE (i:InventoryItem {ItemID: row.ItemID})
      SET i += row
    `);

    // 18. Seed PROCURES
    await session.run(`
      UNWIND [
        {MessID: 'M1', SupplierID: 'SUP4', ItemID: 'IT101', Quantity: 500},
        {MessID: 'M1', SupplierID: 'SUP2', ItemID: 'IT102', Quantity: 200},
        {MessID: 'M2', SupplierID: 'SUP3', ItemID: 'IT104', Quantity: 150},
        {MessID: 'M2', SupplierID: 'SUP1', ItemID: 'IT105', Quantity: 300},
        {MessID: 'M3', SupplierID: 'SUP4', ItemID: 'IT103', Quantity: 100}
      ] AS row
      MERGE (p:Procures {MessID: row.MessID, SupplierID: row.SupplierID, ItemID: row.ItemID})
      SET p += row
      WITH p, row
      MATCH (m:Mess {MessID: row.MessID}), (sup:Supplier {SupplierID: row.SupplierID}), (i:InventoryItem {ItemID: row.ItemID})
      MERGE (m)-[:PROCURES]->(p)
      MERGE (p)-[:FROM_SUPPLIER]->(sup)
      MERGE (p)-[:OF_ITEM]->(i)
      MERGE (sup)-[:SUPPLIES]->(i)
    `);

    // 19. Seed PAYMENT
    await session.run(`
      UNWIND [
        {PaymentID: 'PAY1001', StudentID: 'S1001', Amount: 12500, PaymentMode: 'NetBanking', Status: 'Successful', PaymentDay: 5, PaymentMonth: 8, PaymentYear: 2026},
        {PaymentID: 'PAY1002', StudentID: 'S1002', Amount: 14000, PaymentMode: 'UPI', Status: 'Successful', PaymentDay: 6, PaymentMonth: 8, PaymentYear: 2026},
        {PaymentID: 'PAY1003', StudentID: 'S1003', Amount: 11000, PaymentMode: 'Credit Card', Status: 'Successful', PaymentDay: 7, PaymentMonth: 8, PaymentYear: 2026},
        {PaymentID: 'PAY1004', StudentID: 'S1004', Amount: 11000, PaymentMode: 'UPI', Status: 'Pending', PaymentDay: 10, PaymentMonth: 8, PaymentYear: 2026},
        {PaymentID: 'PAY1005', StudentID: 'S1005', Amount: 15000, PaymentMode: 'Debit Card', Status: 'Successful', PaymentDay: 12, PaymentMonth: 8, PaymentYear: 2026}
      ] AS row
      MERGE (p:Payment {PaymentID: row.PaymentID})
      SET p += row
      WITH p, row
      MATCH (s:Student {StudentID: row.StudentID})
      MERGE (s)-[:MADE_PAYMENT]->(p)
    `);

    // 20. Seed PAYMENT_DETAIL
    await session.run(`
      UNWIND [
        {PaymentID: 'PAY1001', DetailID: 'D1', Month: 'August', Year: 2026, MessCharges: 11500, OtherCharges: 1000},
        {PaymentID: 'PAY1002', DetailID: 'D1', Month: 'August', Year: 2026, MessCharges: 13000, OtherCharges: 1000},
        {PaymentID: 'PAY1003', DetailID: 'D1', Month: 'August', Year: 2026, MessCharges: 10000, OtherCharges: 1000},
        {PaymentID: 'PAY1003', DetailID: 'D2', Month: 'July (Arrears)', Year: 2026, MessCharges: 0, OtherCharges: 1000},
        {PaymentID: 'PAY1005', DetailID: 'D1', Month: 'August', Year: 2026, MessCharges: 14000, OtherCharges: 1000}
      ] AS row
      MERGE (pd:PaymentDetail {PaymentID: row.PaymentID, DetailID: row.DetailID})
      SET pd += row
      WITH pd, row
      MATCH (p:Payment {PaymentID: row.PaymentID})
      MERGE (p)-[:HAS_DETAIL]->(pd)
    `);

    console.log('[Neo4j] Idempotent graph schema initialization & seed completed successfully.');
    return { initialized: true, tables: REQUIRED_TABLES };
  } finally {
    await session.close();
  }
}

/**
 * Verify presence of all 18 entity labels and relationships in Neo4j
 */
async function verifyDatabase() {
  const driver = getDriver();
  const session = driver.session();
  try {
    console.log('\n--- VERIFYING NEO4J AURADB APPLICATION ENTITIES ---');
    const tableCounts = {};

    for (const table of REQUIRED_TABLES) {
      const label = TABLE_TO_LABEL[table];
      const res = await session.run(`MATCH (n:${label}) RETURN count(n) as count`);
      const count = res.records[0].get('count').toNumber();
      tableCounts[table] = count;
      console.log(`${table.padEnd(20)} (${label.padEnd(15)}): ${count} node(s)`);
    }

    const relRes = await session.run(`MATCH ()-[r]->() RETURN type(r) as relType, count(r) as count ORDER BY relType ASC`);
    const relSummary = relRes.records.map((r) => ({
      type: r.get('relType'),
      count: r.get('count').toNumber()
    }));

    console.log('\n--- GRAPH RELATIONSHIPS VERIFIED ---');
    relSummary.forEach((rel) => {
      console.log(` - [:${rel.type}]: ${rel.count} connection(s)`);
    });

    const missing = REQUIRED_TABLES.filter((t) => tableCounts[t] === 0);
    if (missing.length === 0) {
      console.log('\n SUCCESS: All 18 application entity types exist with data in Neo4j AuraDB.\n');
      return { success: true, count: REQUIRED_TABLES.length, tables: REQUIRED_TABLES, counts: tableCounts, relationships: relSummary };
    } else {
      console.warn('\n Notice: Some entities currently have 0 records:', missing);
      return { success: false, missing, counts: tableCounts };
    }
  } catch (err) {
    console.error('Neo4j verification error:', err.message);
    return { success: false, error: err.message };
  } finally {
    await session.close();
  }
}

/**
 * Test connectivity for health checks
 */
async function testConnection() {
  try {
    const driver = getDriver();
    const serverInfo = await driver.getServerInfo();
    const res = await runCypher(`
      RETURN 1 AS connected, 
             datetime() AS server_time,
             $agent AS agent,
             $address AS address
    `, { agent: serverInfo.agent, address: serverInfo.address });
    return {
      connected: true,
      details: {
        agent: serverInfo.agent,
        address: serverInfo.address,
        protocolVersion: serverInfo.protocolVersion,
        serverTime: res[0]?.server_time
      }
    };
  } catch (err) {
    return { connected: false, error: err.message };
  }
}

/**
 * Comprehensive health status for /api/health
 */
async function getHealthStatus() {
  const conn = await testConnection();
  if (!conn.connected) {
    return {
      status: 'unhealthy',
      database: 'disconnected',
      engine: 'Neo4j AuraDB',
      error: conn.error,
      timestamp: new Date().toISOString()
    };
  }

  try {
    const nodeCountRes = await runCypher('MATCH (n) RETURN count(n) as nodeCount');
    const relCountRes = await runCypher('MATCH ()-[r]->() RETURN count(r) as relCount');
    const totalNodes = nodeCountRes[0]?.nodeCount || 0;
    const totalRelationships = relCountRes[0]?.relCount || 0;

    return {
      status: 'healthy',
      database: 'connected',
      engine: 'Neo4j AuraDB',
      edition: 'Enterprise Aura Cloud',
      totalApplicationTables: REQUIRED_TABLES.length,
      tables: REQUIRED_TABLES,
      graphMetrics: {
        totalNodes,
        totalRelationships
      },
      serviceDetails: {
        server: conn.details.agent || 'Neo4j AuraDB',
        address: conn.details.address,
        protocol: conn.details.protocolVersion
      },
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    return {
      status: 'healthy',
      database: 'connected',
      engine: 'Neo4j AuraDB',
      totalApplicationTables: REQUIRED_TABLES.length,
      tables: REQUIRED_TABLES,
      serviceDetails: conn.details,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = {
  getDriver,
  runCypher,
  query: runCypher,
  execute,
  syncRelationships,
  initDatabase,
  verifyDatabase,
  testConnection,
  getHealthStatus,
  getApplicationTables,
  REQUIRED_TABLES,
  TABLE_TO_LABEL,
  TABLE_METADATA
};
