import mongoose,{Document,Schema,Types} from "mongoose";
export interface ITransportStop extends Document {schoolId:Types.ObjectId;routeId:Types.ObjectId;name:string;sequence:number;status:"active"|"inactive";createdAt:Date;updatedAt:Date;}
const schema=new Schema<ITransportStop>({schoolId:{type:Schema.Types.ObjectId,ref:"School",required:true},routeId:{type:Schema.Types.ObjectId,ref:"TransportRoute",required:true},name:{type:String,trim:true,required:true,maxlength:100},sequence:{type:Number,required:true,min:1,max:500},status:{type:String,enum:["active","inactive"],default:"active",required:true}},{timestamps:true});
schema.index({schoolId:1,routeId:1,sequence:1},{unique:true}); schema.index({schoolId:1,routeId:1,status:1});
export const TransportStop=mongoose.model<ITransportStop>("TransportStop",schema);
