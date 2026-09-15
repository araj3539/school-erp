import { describe, expect, it } from "vitest";
import { StudentBehaviour } from "./StudentBehaviour.js";
describe("StudentBehaviour model",()=>{
 it("defaults severity and status",()=>{const d=new StudentBehaviour({schoolId:"507f1f77bcf86cd799439011",studentId:"507f1f77bcf86cd799439012",kind:"incident",category:"conduct",occurredAt:new Date(),description:"Disruption",createdBy:"507f1f77bcf86cd799439013"});expect(d.severity).toBe("low");expect(d.status).toBe("open");});
 it("declares the supported enums",()=>{expect((StudentBehaviour.schema.path("kind") as any).enumValues).toEqual(["incident","recognition"]);expect((StudentBehaviour.schema.path("status") as any).enumValues).toEqual(["open","resolved","dismissed"]);});
 it("indexes school and student history",()=>expect(StudentBehaviour.schema.indexes().some(([fields])=>JSON.stringify(fields)===JSON.stringify({schoolId:1,studentId:1,occurredAt:-1}))).toBe(true));
});
