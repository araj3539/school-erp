import mongoose, { Document, Schema, Types } from "mongoose";
import { TransportVehicleStatus } from "@school-erp/shared";
export interface ITransportVehicle extends Document { schoolId: Types.ObjectId; registrationNo:string; vehicleType:string; capacity:number; allocatedSeats:number; status:(typeof TransportVehicleStatus)[keyof typeof TransportVehicleStatus]; createdAt:Date; updatedAt:Date; }
const schema=new Schema<ITransportVehicle>({schoolId:{type:Schema.Types.ObjectId,ref:"School",required:true},registrationNo:{type:String,trim:true,required:true,maxlength:30},vehicleType:{type:String,trim:true,required:true,maxlength:50},capacity:{type:Number,required:true,min:1,max:500},allocatedSeats:{type:Number,required:true,min:0,default:0},status:{type:String,enum:Object.values(TransportVehicleStatus),required:true,default:TransportVehicleStatus.ACTIVE}},{timestamps:true});
schema.index({schoolId:1,registrationNo:1},{unique:true}); schema.index({schoolId:1,status:1});
export const TransportVehicle=mongoose.model<ITransportVehicle>("TransportVehicle",schema);
