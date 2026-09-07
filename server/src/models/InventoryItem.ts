import mongoose,{Document,Schema,Types} from "mongoose";
export const InventoryItemStatus={ACTIVE:"active",INACTIVE:"inactive",RETIRED:"retired"} as const;
export interface IInventoryItem extends Document{schoolId:Types.ObjectId;itemCode:string;name:string;category?:string;unit:string;quantity:number;reorderLevel:number;status:keyof typeof InventoryItemStatus;createdAt:Date;updatedAt:Date}
const schema=new Schema<IInventoryItem>({schoolId:{type:Schema.Types.ObjectId,ref:"School",required:true},itemCode:{type:String,trim:true,required:true,maxlength:40},name:{type:String,trim:true,required:true,maxlength:150},category:{type:String,trim:true,maxlength:80},unit:{type:String,trim:true,required:true,maxlength:30},quantity:{type:Number,required:true,min:0,default:0},reorderLevel:{type:Number,required:true,min:0,default:0},status:{type:String,enum:Object.values(InventoryItemStatus),required:true,default:InventoryItemStatus.ACTIVE}},{timestamps:true});
schema.index({schoolId:1,itemCode:1},{unique:true});schema.index({schoolId:1,status:1});schema.index({schoolId:1,name:1});
export const InventoryItem=mongoose.model<IInventoryItem>("InventoryItem",schema);
