import { describe, expect, it } from "vitest";
import { CreateStudentBehaviourSchema, StudentBehaviourQuerySchema, UpdateStudentBehaviourSchema } from "./studentBehaviour.js";
const studentId="507f1f77bcf86cd799439011";
describe("student behaviour validators",()=>{
 it("accepts an incident",()=>expect(CreateStudentBehaviourSchema.safeParse({studentId,kind:"incident",category:"conduct",severity:"medium",occurredAt:new Date(),description:"Repeated disruption"}).success).toBe(true));
 it("accepts recognition",()=>expect(CreateStudentBehaviourSchema.safeParse({studentId,kind:"recognition",category:"achievement",occurredAt:new Date(),description:"Helped classmates"}).success).toBe(true));
 it("rejects an invalid student id",()=>expect(CreateStudentBehaviourSchema.safeParse({studentId:"bad",kind:"incident",category:"conduct",occurredAt:new Date(),description:"x"}).success).toBe(false));
 it("rejects an inverted date range",()=>expect(StudentBehaviourQuerySchema.safeParse({from:"2026-09-20",to:"2026-09-10"}).success).toBe(false));
 it("requires an update field",()=>expect(UpdateStudentBehaviourSchema.safeParse({}).success).toBe(false));
 it("accepts resolution",()=>expect(UpdateStudentBehaviourSchema.safeParse({status:"resolved"}).success).toBe(true));
});
