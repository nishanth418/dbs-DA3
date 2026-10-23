// ==============================================================================
// DBS DA3 - Neo4j AuraDB Graph Schema & Constraints
// 18 Entities modeled as Nodes with Graph Relationships
// ==============================================================================

// 1. UNIQUE IDENTIFIER CONSTRAINTS
CREATE CONSTRAINT warden_id_unique IF NOT EXISTS FOR (w:Warden) REQUIRE w.WardenID IS UNIQUE;
CREATE CONSTRAINT hostel_id_unique IF NOT EXISTS FOR (h:Hostel) REQUIRE h.HostelID IS UNIQUE;
CREATE CONSTRAINT room_type_unique IF NOT EXISTS FOR (rt:RoomType) REQUIRE rt.Type IS UNIQUE;
CREATE CONSTRAINT room_no_unique IF NOT EXISTS FOR (r:Room) REQUIRE r.RoomNo IS UNIQUE;
CREATE CONSTRAINT student_id_unique IF NOT EXISTS FOR (s:Student) REQUIRE s.StudentID IS UNIQUE;
CREATE CONSTRAINT mess_id_unique IF NOT EXISTS FOR (m:Mess) REQUIRE m.MessID IS UNIQUE;
CREATE CONSTRAINT staff_id_unique IF NOT EXISTS FOR (st:Staff) REQUIRE st.StaffID IS UNIQUE;
CREATE CONSTRAINT supplier_id_unique IF NOT EXISTS FOR (sp:Supplier) REQUIRE sp.SupplierID IS UNIQUE;
CREATE CONSTRAINT item_id_unique IF NOT EXISTS FOR (i:InventoryItem) REQUIRE i.ItemID IS UNIQUE;
CREATE CONSTRAINT payment_id_unique IF NOT EXISTS FOR (p:Payment) REQUIRE p.PaymentID IS UNIQUE;
CREATE CONSTRAINT procure_id_unique IF NOT EXISTS FOR (pr:Procures) REQUIRE pr.ProcureID IS UNIQUE;
CREATE CONSTRAINT meal_id_unique IF NOT EXISTS FOR (ml:Meal) REQUIRE ml.MealID IS UNIQUE;

// 2. SEARCH INDEXES
CREATE INDEX student_name_index IF NOT EXISTS FOR (s:Student) ON (s.FirstName, s.LastName);
CREATE INDEX room_status_index IF NOT EXISTS FOR (r:Room) ON (r.Status);
CREATE INDEX payment_status_index IF NOT EXISTS FOR (p:Payment) ON (p.Status);
CREATE INDEX staff_role_index IF NOT EXISTS FOR (st:Staff) ON (st.Role);

// ==============================================================================
// GRAPH RELATIONSHIP ONTOLOGY:
//
// (:Hostel)-[:MANAGED_BY]->(:Warden)
// (:Room)-[:LOCATED_IN]->(:Hostel)
// (:Room)-[:HAS_TYPE]->(:RoomType)
// (:Student)-[:ALLOCATED_ROOM]->(:Room)
// (:Student)-[:RESIDES_IN]->(:Hostel)
// (:Student)-[:ENROLLED_IN_MESS]->(:Mess)
// (:Student)-[:MADE_PAYMENT]->(:Payment)
// (:Payment)-[:HAS_DETAIL]->(:PaymentDetail)
// (:Mess)-[:LOCATED_IN_HOSTEL]->(:Hostel)
// (:Mess)-[:SERVES_MEAL]->(:Meal)
// (:Staff)-[:WORKS_AT_HOSTEL]->(:Hostel)
// (:Staff)-[:ASSIGNED_TO_MESS]->(:Mess)
// (:Procures)-[:SUPPLIED_BY]->(:Supplier)
// (:Procures)-[:DELIVERED_TO]->(:Mess)
// (:Procures)-[:PROCURED_ITEM]->(:InventoryItem)
//
// MULTI-VALUED ATTRIBUTE RELATIONSHIPS:
// (:Warden)-[:HAS_PHONE]->(:WardenPhone)
// (:Student)-[:HAS_PHONE]->(:StudentPhone)
// (:Staff)-[:HAS_PHONE]->(:StaffPhone)
// (:Supplier)-[:HAS_PHONE]->(:SupplierPhone)
// (:Mess)-[:HAS_CONTACT]->(:MessContact)
// ==============================================================================
