import mongoose, { Document, Schema, Types } from "mongoose";
import { TransportRouteStatus } from "@school-erp/shared";

export interface ITransportRoute extends Document { schoolId: Types.ObjectId; name: string; code: string; status: (typeof TransportRouteStatus)[keyof typeof TransportRouteStatus]; createdAt: Date; updatedAt: Date; }
const schema = new Schema<ITransportRoute>({ schoolId:{type:Schema.Types.ObjectId,ref:"School",required:true}, name:{type:String,trim:true,required:true,maxlength:100}, code:{type:String,trim:true,required:true,maxlength:30}, status:{type:String,enum:Object.values(TransportRouteStatus),default:TransportRouteStatus.ACTIVE,required:true} },{timestamps:true});
schema.index({schoolId:1,code:1},{unique:true}); schema.index({schoolId:1,status:1});
export const TransportRoute = mongoose.model<ITransportRoute>("TransportRoute",schema);
